"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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

export async function getDaftarBerkas(): Promise<DaftarBerkasResponse> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // 1. List root items in 'foto-kehadiran' bucket
      const { data: rootItems, error: listError } = await supabase.storage
        .from("foto-kehadiran")
        .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

      if (listError) {
        return {
          success: false,
          folders: [],
          files: [],
          totalSize: 0,
          maxSizeBytes: SUPABASE_FREE_STORAGE_LIMIT_BYTES,
          error: listError.message,
        };
      }

      const allFiles: BerkasItem[] = [];
      const folderMap = new Map<string, BerkasItem[]>();
      let totalBytes = 0;

      // Group files into subfolders
      for (const item of rootItems || []) {
        if (!item.id && item.name) {
          // Folder - list contents
          const { data: subFiles } = await supabase.storage
            .from("foto-kehadiran")
            .list(item.name, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

          if (subFiles && subFiles.length > 0) {
            const folderFiles: BerkasItem[] = [];

            for (const sub of subFiles) {
              const fullPath = `${item.name}/${sub.name}`;
              const size = sub.metadata?.size || 0;
              totalBytes += size;

              // Generate signed URL (valid for 24 hours)
              const { data: signed } = await supabase.storage
                .from("foto-kehadiran")
                .createSignedUrl(fullPath, 86400);

              const berkasItem: BerkasItem = {
                name: sub.name,
                id: sub.id,
                size: size,
                created_at: sub.created_at,
                url: signed?.signedUrl,
                folder: item.name,
                fullPath,
              };

              folderFiles.push(berkasItem);
              allFiles.push(berkasItem);
            }

            folderMap.set(item.name, folderFiles);
          }
        } else if (item.name) {
          // Root level file
          const size = item.metadata?.size || 0;
          totalBytes += size;
          const { data: signed } = await supabase.storage
            .from("foto-kehadiran")
            .createSignedUrl(item.name, 86400);

          const berkasItem: BerkasItem = {
            name: item.name,
            id: item.id,
            size: size,
            created_at: item.created_at,
            url: signed?.signedUrl,
            fullPath: item.name,
          };

          allFiles.push(berkasItem);

          const existingRoot = folderMap.get("root") || [];
          existingRoot.push(berkasItem);
          folderMap.set("root", existingRoot);
        }
      }

      // 2. Fetch visitor info from database for each folder (kunjunganId)
      const folderIds = Array.from(folderMap.keys()).filter((id) => id !== "root");
      const kunjunganDataMap = new Map<string, any>();

      if (folderIds.length > 0) {
        const { data: kunjunganList } = await supabase
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
          .in("id", folderIds);

        if (kunjunganList) {
          for (const k of kunjunganList) {
            kunjunganDataMap.set(k.id, k);
          }
        }
      }

      // 3. Assemble structured folders
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

        folders.push({
          id: folderId,
          kunjunganId: folderId,
          namaTamu: kData?.nama || `Kunjungan Tamu (#${folderId.slice(0, 8)})`,
          instansiNama:
            kData?.instansi?.nama || kData?.instansi_lainnya || "Masyarakat / Tamu Umum",
          nomorUrut: kData?.nomor_urut,
          tanggal: kData?.tanggal || files[0]?.created_at?.split("T")[0],
          waktuMasuk: kData?.waktu_masuk,
          keperluan: kData?.keperluan,
          status: kData?.status,
          files,
          totalBytes: folderSize,
        });
      }

      // Sort folders: newest visit first
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
    } catch (err: any) {
      return {
        success: false,
        folders: [],
        files: [],
        totalSize: 0,
        maxSizeBytes: SUPABASE_FREE_STORAGE_LIMIT_BYTES,
        error: err.message,
      };
    }
  }

  // Demo fallback data if Supabase is offline
  const demoFiles1: BerkasItem[] = [
    {
      name: "foto-tamu-1.jpg",
      size: 245000,
      created_at: new Date().toISOString(),
      url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600",
      folder: "demo-tamu-01",
      fullPath: "demo-tamu-01/foto-tamu-1.jpg",
    },
    {
      name: "foto-tamu-2.jpg",
      size: 260000,
      created_at: new Date().toISOString(),
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
      folder: "demo-tamu-01",
      fullPath: "demo-tamu-01/foto-tamu-2.jpg",
    },
  ];

  const demoFiles2: BerkasItem[] = [
    {
      name: "foto-tamu-3.jpg",
      size: 198000,
      created_at: new Date().toISOString(),
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
        tanggal: new Date().toISOString().split("T")[0],
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
        tanggal: new Date().toISOString().split("T")[0],
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
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // Clean path if any query params or prefix
      const cleanPath = path.split("?")[0].replace(/^foto-kehadiran\//, "").trim();

      // 1. Delete physical file from Supabase storage
      const { error } = await supabase.storage.from("foto-kehadiran").remove([cleanPath]);
      if (error) return { success: false, error: error.message };

      // 2. Also delete metadata record in foto_kehadiran table if present
      await supabase
        .from("foto_kehadiran")
        .delete()
        .or(`storage_path.eq.${cleanPath},storage_path.like.%${cleanPath}%`);

      revalidatePath("/dashboard/berkas");
      revalidatePath("/dashboard/kunjungan");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  revalidatePath("/dashboard/berkas");
  return { success: true };
}

export async function hapusFolderBerkas(folderId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // List all files in this folder
      const { data: subFiles, error: listErr } = await supabase.storage
        .from("foto-kehadiran")
        .list(folderId, { limit: 100 });

      if (listErr) return { success: false, error: listErr.message };

      if (subFiles && subFiles.length > 0) {
        const pathsToDelete = subFiles.map((f: any) => `${folderId}/${f.name}`);
        const { error: removeErr } = await supabase.storage
          .from("foto-kehadiran")
          .remove(pathsToDelete);

        if (removeErr) return { success: false, error: removeErr.message };

        // Clean db records
        for (const path of pathsToDelete) {
          await supabase
            .from("foto_kehadiran")
            .delete()
            .or(`storage_path.eq.${path},storage_path.like.%${path}%`);
        }
      }

      revalidatePath("/dashboard/berkas");
      revalidatePath("/dashboard/kunjungan");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  revalidatePath("/dashboard/berkas");
  return { success: true };
}
