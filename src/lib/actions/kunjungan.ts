"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isDemoAllowed } from "@/lib/supabase/client";
import { mockStore } from "@/lib/store";
import { authorize } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Status, Kunjungan, JenisKelamin } from "@/lib/types";
import { FOTO_BUCKET, cleanStoragePath } from "@/lib/storage-utils";
import { getTodayWITA } from "@/lib/utils";

export interface TambahKunjunganInput {
  nama: string;
  jenis_kelamin?: JenisKelamin;
  no_telepon?: string;
  instansi_id?: string;
  instansi_lainnya?: string;
  bidang_id?: string;
  keperluan: string;
  jumlah_tamu?: number;
  jumlah_laki?: number;
  jumlah_perempuan?: number;
  consent: boolean;
  sumber: "qr" | "petugas";
  /** Honeypot anti-bot: harus kosong. */
  website?: string;
}

type ActionResult = { success: boolean; error?: string };

const STATUSES: Status[] = ["menunggu_foto", "tercatat", "tidak_diverifikasi"];
const PAGE_SIZE = 1000; // batas baris default PostgREST

// ---- Rate limit sederhana (best-effort, per instance server) untuk form publik ----
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 15;
const rateHits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateHits.set(key, hits);
  if (rateHits.size > 5000) {
    for (const [k, v] of rateHits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateHits.delete(k);
    }
  }
  return hits.length > RATE_MAX;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function validateInput(input: Partial<TambahKunjunganInput>, laki: number, perempuan: number): string | null {
  if (!input.nama?.trim()) return "Nama lengkap wajib diisi.";
  if (input.nama.trim().length > 150) return "Nama terlalu panjang (maksimal 150 karakter).";
  if (!input.keperluan?.trim()) return "Keperluan kunjungan wajib diisi.";
  if (input.keperluan.trim().length > 500) return "Keperluan terlalu panjang (maksimal 500 karakter).";
  if (input.no_telepon && input.no_telepon.length > 30) return "Nomor telepon terlalu panjang.";
  if (input.instansi_lainnya && input.instansi_lainnya.length > 200) return "Nama instansi terlalu panjang.";
  if (laki < 0 || perempuan < 0 || laki > 99 || perempuan > 99 || laki + perempuan < 1) {
    return "Jumlah tamu tidak valid.";
  }
  if (input.consent !== true) return "Persetujuan penggunaan data wajib diberikan.";
  return null;
}

function toCount(v: number | undefined): number {
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v as number)) : 0;
}

export async function tambahKunjungan(input: TambahKunjunganInput): Promise<{
  success: boolean;
  data?: Kunjungan;
  error?: string;
}> {
  if (input.website) return { success: false, error: "Permintaan ditolak." };

  // Jika hanya jumlah_tamu yang dikirim (klien lama), anggap semuanya laki-laki.
  const hasBreakdown = input.jumlah_laki !== undefined || input.jumlah_perempuan !== undefined;
  const laki = hasBreakdown ? toCount(input.jumlah_laki) : toCount(input.jumlah_tamu ?? 1);
  const perempuan = hasBreakdown ? toCount(input.jumlah_perempuan) : 0;

  const invalid = validateInput(input, laki, perempuan);
  if (invalid) return { success: false, error: invalid };

  if (isRateLimited(await clientKey())) {
    return { success: false, error: "Terlalu banyak pengiriman. Coba lagi beberapa menit lagi." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // Nomor urut dihitung atomik di database (RPC), aman untuk tamu anonim & submit bersamaan.
      const { data, error } = await supabase.rpc("tambah_kunjungan", {
        p_nama: input.nama.trim(),
        p_no_telepon: input.no_telepon?.trim() || null,
        p_instansi_id: input.instansi_id || null,
        p_instansi_lainnya: input.instansi_lainnya?.trim() || null,
        p_bidang_id: input.bidang_id || null,
        p_keperluan: input.keperluan.trim(),
        p_jumlah_laki: laki,
        p_jumlah_perempuan: perempuan,
        p_jenis_kelamin: input.jenis_kelamin || null,
        p_consent: input.consent,
        p_sumber: input.sumber,
      });

      if (error) {
        if (error.code === "PGRST202") {
          console.error("RPC tambah_kunjungan belum ada. Jalankan supabase/migration_hardening.sql.");
          return { success: false, error: "Sistem belum siap. Hubungi administrator." };
        }
        return { success: false, error: error.message };
      }

      revalidatePath("/dashboard");
      return { success: true, data: data as Kunjungan };
    } catch (err) {
      console.error("Supabase insert error:", err);
      return { success: false, error: "Gagal menyimpan kunjungan." };
    }
  }

  if (!isDemoAllowed()) return { success: false, error: "Layanan belum dikonfigurasi." };

  try {
    const data = mockStore.tambahKunjungan({
      ...input,
      jumlah_tamu: laki + perempuan,
      jumlah_laki: laki,
      jumlah_perempuan: perempuan,
    });
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan kunjungan." };
  }
}

export async function updateStatusKunjungan(id: string, status: Status): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error };
  if (!STATUSES.includes(status)) return { success: false, error: "Status tidak valid." };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("kunjungan").update({ status }).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.editKunjungan(id, { status });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/detail/${id}`);
  return { success: true };
}

export async function getKunjunganHariIni(): Promise<{
  success: boolean;
  data: Kunjungan[];
  error?: string;
}> {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error, data: [] };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const today = getTodayWITA();

      const { data, error } = await supabase
        .from("kunjungan")
        .select(`
          *,
          instansi(id, nama),
          bidang(id, nama),
          foto_kehadiran(id, storage_path, urutan, diambil_pada)
        `)
        .eq("tanggal", today)
        .order("status", { ascending: true })
        .order("nomor_urut", { ascending: true });

      if (error) return { success: false, error: error.message, data: [] };
      return { success: true, data: (data ?? []) as unknown as Kunjungan[] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal memuat data.", data: [] };
    }
  }

  return { success: true, data: mockStore.getKunjunganHariIni() };
}

export async function getKunjunganDetail(id: string): Promise<{
  success: boolean;
  data: Kunjungan | null;
  error?: string;
}> {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error, data: null };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("kunjungan")
        .select(`
          *,
          instansi(id, nama),
          bidang(id, nama, urutan),
          foto_kehadiran(id, storage_path, urutan, diambil_oleh, diambil_pada)
        `)
        .eq("id", id)
        .single();

      if (error) return { success: false, error: error.message, data: null };

      const kunjungan = data as unknown as Kunjungan;

      // Satu request batch untuk semua signed URL (bukan satu per foto).
      const fotos = kunjungan.foto_kehadiran ?? [];
      const storageFotos = fotos.filter(
        (f) => f.storage_path && !f.storage_path.startsWith("http") && !f.storage_path.startsWith("data:")
      );

      const urlByPath = new Map<string, string>();
      if (storageFotos.length > 0) {
        const paths = storageFotos
          .map((f) => cleanStoragePath(f.storage_path))
          .filter((p): p is string => Boolean(p));
        const { data: signed } = await supabase.storage.from(FOTO_BUCKET).createSignedUrls(paths, 86400);
        for (const s of signed ?? []) {
          if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
        }
      }

      kunjungan.foto_kehadiran = fotos.map((f) => {
        const clean = cleanStoragePath(f.storage_path);
        return { ...f, url: (clean && urlByPath.get(clean)) || f.url || f.storage_path };
      });

      return { success: true, data: kunjungan };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal memuat data.", data: null };
    }
  }

  const data = mockStore.getKunjunganDetail(id);
  return { success: true, data };
}

export async function getKunjunganRekap(
  dari: string,
  sampai: string,
  instansiId?: string
): Promise<{
  success: boolean;
  data: Kunjungan[];
  error?: string;
}> {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error, data: [] };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const rows: Kunjungan[] = [];

      // PostgREST membatasi 1000 baris per request: ambil bertahap agar rekap tidak terpotong.
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = supabase
          .from("kunjungan")
          .select(`
            *,
            instansi(id, nama),
            bidang(id, nama),
            foto_kehadiran(id)
          `)
          .gte("tanggal", dari)
          .lte("tanggal", sampai)
          .order("tanggal", { ascending: true })
          .order("nomor_urut", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (instansiId) query = query.eq("instansi_id", instansiId);

        const { data, error } = await query;
        if (error) return { success: false, error: error.message, data: [] };

        rows.push(...((data ?? []) as unknown as Kunjungan[]));
        if (!data || data.length < PAGE_SIZE) break;
      }

      return { success: true, data: rows };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal memuat rekap.", data: [] };
    }
  }

  return { success: true, data: mockStore.getKunjunganRekap(dari, sampai, instansiId) };
}

export async function editKunjungan(id: string, input: Partial<TambahKunjunganInput>): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!input.nama?.trim()) return { success: false, error: "Nama lengkap wajib diisi." };
  if (input.nama.trim().length > 150) return { success: false, error: "Nama terlalu panjang." };
  if (input.keperluan && input.keperluan.length > 500) return { success: false, error: "Keperluan terlalu panjang." };
  if (input.jumlah_tamu !== undefined && (!Number.isFinite(input.jumlah_tamu) || input.jumlah_tamu < 1 || input.jumlah_tamu > 198)) {
    return { success: false, error: "Jumlah tamu tidak valid." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = {
      nama: input.nama.trim(),
      no_telepon: input.no_telepon?.trim() || null,
      instansi_id: input.instansi_id || null,
      instansi_lainnya: input.instansi_lainnya?.trim() || null,
      bidang_id: input.bidang_id || null,
      keperluan: input.keperluan?.trim() || null,
      jumlah_tamu: input.jumlah_tamu || 1,
    };
    if (input.jenis_kelamin) updateData.jenis_kelamin = input.jenis_kelamin;

    if (input.jumlah_laki !== undefined || input.jumlah_perempuan !== undefined) {
      updateData.jumlah_laki = toCount(input.jumlah_laki);
      updateData.jumlah_perempuan = toCount(input.jumlah_perempuan);
      updateData.jumlah_tamu = (updateData.jumlah_laki as number) + (updateData.jumlah_perempuan as number);
    } else if (input.jumlah_tamu !== undefined) {
      // Total diubah tanpa rincian gender: rincian lama tidak lagi akurat.
      const { data: current } = await supabase
        .from("kunjungan")
        .select("jumlah_tamu")
        .eq("id", id)
        .maybeSingle();
      if (current && current.jumlah_tamu !== updateData.jumlah_tamu) {
        updateData.jumlah_laki = null;
        updateData.jumlah_perempuan = null;
      }
    }

    const { error } = await supabase.from("kunjungan").update(updateData).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.editKunjungan(id, input as Partial<Kunjungan>);
  }

  revalidatePath(`/dashboard/detail/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function hapusKunjungan(id: string): Promise<ActionResult> {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // 1. Kumpulkan file foto di storage yang terkait kunjungan ini
      const { data: fotoList } = await supabase
        .from("foto_kehadiran")
        .select("storage_path")
        .eq("kunjungan_id", id);

      const pathsToDelete = new Set<string>();
      for (const f of fotoList ?? []) {
        const p = cleanStoragePath(f.storage_path);
        if (p) pathsToDelete.add(p);
      }

      // Sisa file di folder kunjungan (jika ada yang tidak tercatat di tabel)
      const { data: folderFiles } = await supabase.storage.from(FOTO_BUCKET).list(id, { limit: 100 });
      for (const file of folderFiles ?? []) pathsToDelete.add(`${id}/${file.name}`);

      // 2. Hapus file fisik
      if (pathsToDelete.size > 0) {
        const { error: storageDelErr } = await supabase.storage
          .from(FOTO_BUCKET)
          .remove([...pathsToDelete]);
        if (storageDelErr) {
          console.warn("Peringatan storage remove pada hapus kunjungan:", storageDelErr.message);
        }
      }

      // 3. Hapus data kunjungan (foto_kehadiran ikut terhapus via ON DELETE CASCADE)
      const { error } = await supabase.from("kunjungan").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus kunjungan." };
    }
  } else {
    mockStore.hapusKunjungan(id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rekap");
  revalidatePath("/dashboard/berkas");
  return { success: true };
}
