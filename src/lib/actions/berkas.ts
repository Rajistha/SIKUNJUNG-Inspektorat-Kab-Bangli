"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isDemoAllowed } from "@/lib/supabase/client";
import { authorize } from "@/lib/session";
import { FOTO_BUCKET, cleanStoragePath, mapInChunks } from "@/lib/storage-utils";
import { revalidatePath } from "next/cache";

export interface BerkasItem {
  name: string;
  id?: string;
  size?: number;
  created_at?: string;
  url?: string;
  folder?: string;
  fullPath: string;
}

export interface BerkasFolder {
  id: string; // kunjunganId or folder name
  kunjunganId?: string;
  namaTamu: string;
  instansiNama: string;
  nomorUrut?: number;
  tanggal?: string;
  waktuMasuk?: string;
  keperluan?: string;
  status?: string;
  files: BerkasItem[];
  totalBytes: number;
}

export interface DaftarBerkasResponse {
  success: boolean;
  folders: BerkasFolder[];
  files: BerkasItem[];
  totalSize: number;
  maxSizeBytes: number; // 1 GB for Supabase Free plan
  error?: string;
}

const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB (1,073,741,824 bytes)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_PAGE = 1000;
const PARALLEL = 10;

interface KunjunganBerkasRow {
  id: string;
  nomor_urut: number;
  nama: string;
  instansi: { nama: string } | { nama: string }[] | null;
  instansi_lainnya: string | null;
  tanggal: string;
  waktu_masuk: string;
  keperluan: string | null;
  status: string;
}

interface StorageEntry {
  name: string;
  id: string | null;
  created_at?: string;
  metadata?: { size?: number } | null;
}

function emptyResponse(error?: string): DaftarBerkasResponse {
  return {
    success: !error,
    folders: [],
    files: [],
    totalSize: 0,
    maxSizeBytes: SUPABASE_FREE_STORAGE_LIMIT_BYTES,
    error,
  };
}

export async function getDaftarBerkas(): Promise<DaftarBerkasResponse> {
  const auth = await authorize("admin");
  if (!auth.ok) return emptyResponse(auth.error);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const bucket = supabase.storage.from(FOTO_BUCKET);

      // 1. Daftar seluruh isi root bucket (berhalaman, tidak terpotong di 200 item)
      const rootItems: StorageEntry[] = [];
      for (let offset = 0; ; offset += LIST_PAGE) {
        const { data, error } = await bucket.list("", {
          limit: LIST_PAGE,
          offset,
          sortBy: { column: "created_at", order: "desc" },
        });
        if (error) return emptyResponse(error.message);
        rootItems.push(...((data ?? []) as StorageEntry[]));
        if (!data || data.length < LIST_PAGE) break;
      }

      const folderNames = rootItems.filter((i) => !i.id && i.name).map((i) => i.name);
      const rootFiles = rootItems.filter((i) => i.id && i.name);

      // 2. Isi tiap folder diambil paralel (bukan satu per satu)
      const folderContents = await mapInChunks(folderNames, PARALLEL, async (folder) => {
        const { data } = await bucket.list(folder, {
          limit: LIST_PAGE,
          sortBy: { column: "created_at", order: "desc" },
        });
        return { folder, items: (data ?? []) as StorageEntry[] };
      });

      const allFiles: BerkasItem[] = [];
      const folderMap = new Map<string, BerkasItem[]>();
      let totalBytes = 0;

      for (const { folder, items } of folderContents) {
        const files: BerkasItem[] = [];
        for (const sub of items) {
          if (!sub.id) continue; // abaikan subfolder bersarang
          const size = sub.metadata?.size || 0;
          totalBytes += size;
          const item: BerkasItem = {
            name: sub.name,
            id: sub.id,
            size,
            created_at: sub.created_at,
            folder,
            fullPath: `${folder}/${sub.name}`,
          };
          files.push(item);
          allFiles.push(item);
        }
        if (files.length > 0) folderMap.set(folder, files);
      }

      if (rootFiles.length > 0) {
        const files: BerkasItem[] = rootFiles.map((item) => {
          const size = item.metadata?.size || 0;
          totalBytes += size;
          const berkas: BerkasItem = {
            name: item.name,
            id: item.id ?? undefined,
            size,
            created_at: item.created_at,
            fullPath: item.name,
          };
          allFiles.push(berkas);
          return berkas;
        });
        folderMap.set("root", files);
      }

      // 3. Signed URL dalam batch (satu request per 200 file, bukan satu per file)
      const pathChunks: string[][] = [];
      for (let i = 0; i < allFiles.length; i += 200) {
        pathChunks.push(allFiles.slice(i, i + 200).map((f) => f.fullPath));
      }
      const signedResults = await mapInChunks(pathChunks, 3, async (paths) => {
        const { data } = await bucket.createSignedUrls(paths, 86400);
        return data ?? [];
      });
      const urlByPath = new Map<string, string>();
      for (const batch of signedResults) {
        for (const s of batch) {
          if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
        }
      }
      for (const f of allFiles) f.url = urlByPath.get(f.fullPath);

      // 4. Info tamu dari database (hanya folder ber-UUID, dipecah agar query tidak terlalu panjang)
      const folderIds = [...folderMap.keys()].filter((id) => UUID_RE.test(id));
      const kunjunganDataMap = new Map<string, KunjunganBerkasRow>();
      const idChunks: string[][] = [];
      for (let i = 0; i < folderIds.length; i += 100) idChunks.push(folderIds.slice(i, i + 100));

      const kunjunganChunks = await mapInChunks(idChunks, 3, async (ids) => {
        const { data } = await supabase
          .from("kunjungan")
          .select(`
            id,
            nomor_urut,
            nama,
            instansi:instansi_id (nama),
            instansi_lainnya,
            tanggal,
            waktu_masuk,
            keperluan,
            status
          `)
          .in("id", ids);
        return (data ?? []) as unknown as KunjunganBerkasRow[];
      });
      for (const chunk of kunjunganChunks) {
        for (const k of chunk) kunjunganDataMap.set(k.id, k);
      }

      // 5. Susun folder
      const folders: BerkasFolder[] = [];

      for (const [folderId, files] of folderMap.entries()) {
        const folderSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

        if (folderId === "root") {
          folders.push({
            id: "root",
            namaTamu: "Berkas Utama / Lainnya",
            instansiNama: "Arsip Sistem",
            files,
            totalBytes: folderSize,
          });
          continue;
        }

        const kData = kunjunganDataMap.get(folderId);
        const instansiRel = Array.isArray(kData?.instansi) ? kData?.instansi[0] : kData?.instansi;

        folders.push({
          id: folderId,
          kunjunganId: folderId,
          namaTamu: kData?.nama || `Kunjungan Tamu (#${folderId.slice(0, 8)})`,
          instansiNama: instansiRel?.nama || kData?.instansi_lainnya || "Masyarakat / Tamu Umum",
          nomorUrut: kData?.nomor_urut,
          tanggal: kData?.tanggal || files[0]?.created_at?.split("T")[0],
          waktuMasuk: kData?.waktu_masuk,
          keperluan: kData?.keperluan ?? undefined,
          status: kData?.status,
          files,
          totalBytes: folderSize,
        });
      }

      // Kunjungan terbaru lebih dulu
      folders.sort((a, b) => {
        if (a.id === "root") return 1;
        if (b.id === "root") return -1;
        const dateA = a.tanggal || "";
        const dateB = b.tanggal || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.nomorUrut || 0) - (a.nomorUrut || 0);
      });

      return {
        success: true,
        folders,
        files: allFiles,
        totalSize: totalBytes,
        maxSizeBytes: SUPABASE_FREE_STORAGE_LIMIT_BYTES,
      };
    } catch (err) {
      return emptyResponse(err instanceof Error ? err.message : "Gagal memuat berkas.");
    }
  }

  if (!isDemoAllowed()) return emptyResponse("Layanan belum dikonfigurasi.");

  // Demo fallback data (hanya development / ALLOW_DEMO_MODE=true)
  const today = new Date().toISOString();
  const demoFiles1: BerkasItem[] = [
    {
      name: "foto-tamu-1.jpg",
      size: 245000,
      created_at: today,
      url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600",
      folder: "demo-tamu-01",
      fullPath: "demo-tamu-01/foto-tamu-1.jpg",
    },
    {
      name: "foto-tamu-2.jpg",
      size: 260000,
      created_at: today,
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
      folder: "demo-tamu-01",
      fullPath: "demo-tamu-01/foto-tamu-2.jpg",
    },
  ];

  const demoFiles2: BerkasItem[] = [
    {
      name: "foto-tamu-3.jpg",
      size: 198000,
      created_at: today,
      url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
      folder: "demo-tamu-02",
      fullPath: "demo-tamu-02/foto-tamu-3.jpg",
    },
  ];

  return {
    success: true,
    folders: [
      {
        id: "demo-tamu-01",
        kunjunganId: "demo-tamu-01",
        namaTamu: "I Wayan Sudarsana",
        instansiNama: "Badan Kepegawaian dan Pengembangan SDM (BKPSDM)",
        nomorUrut: 1,
        tanggal: today.split("T")[0],
        keperluan: "Koordinasi tindak lanjut LHP tahunan",
        status: "tercatat",
        files: demoFiles1,
        totalBytes: 505000,
      },
      {
        id: "demo-tamu-02",
        kunjunganId: "demo-tamu-02",
        namaTamu: "Ni Kadek Ariani",
        instansiNama: "Badan Pengelola Keuangan, Pendapatan dan Aset Daerah (BPKPAD)",
        nomorUrut: 2,
        tanggal: today.split("T")[0],
        keperluan: "Konsultasi sistem pelaporan aset",
        status: "tercatat",
        files: demoFiles2,
        totalBytes: 198000,
      },
    ],
    files: [...demoFiles1, ...demoFiles2],
    totalSize: 703000,
    maxSizeBytes: SUPABASE_FREE_STORAGE_LIMIT_BYTES,
  };
}

export async function hapusBerkas(path: string): Promise<{ success: boolean; error?: string }> {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      const cleanPath = cleanStoragePath(path);
      if (!cleanPath) return { success: false, error: "Path berkas tidak valid." };

      // 1. Hapus file fisik
      const { error } = await supabase.storage.from(FOTO_BUCKET).remove([cleanPath]);
      if (error) return { success: false, error: error.message };

      // 2. Hapus catatan metadata (pencocokan persis, tanpa wildcard)
      await supabase.from("foto_kehadiran").delete().eq("storage_path", cleanPath);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus berkas." };
    }
  }

  revalidatePath("/dashboard/berkas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function hapusFolderBerkas(folderId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      const folder = cleanStoragePath(folderId);
      if (!folder || folder.includes("/")) return { success: false, error: "ID folder tidak valid." };

      const bucket = supabase.storage.from(FOTO_BUCKET);
      const pathsToDelete: string[] = [];
      for (let offset = 0; ; offset += LIST_PAGE) {
        const { data, error: listErr } = await bucket.list(folder, { limit: LIST_PAGE, offset });
        if (listErr) return { success: false, error: listErr.message };
        pathsToDelete.push(...(data ?? []).filter((f) => f.id).map((f) => `${folder}/${f.name}`));
        if (!data || data.length < LIST_PAGE) break;
      }

      if (pathsToDelete.length > 0) {
        const { error: removeErr } = await bucket.remove(pathsToDelete);
        if (removeErr) return { success: false, error: removeErr.message };

        await supabase.from("foto_kehadiran").delete().in("storage_path", pathsToDelete);
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus folder." };
    }
  }

  revalidatePath("/dashboard/berkas");
  revalidatePath("/dashboard");
  return { success: true };
}
