"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mockStore } from "@/lib/store";
import { revalidatePath } from "next/cache";
import type { Status, Kunjungan, JenisKelamin } from "@/lib/types";
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
  consent: boolean;
  sumber: "qr" | "petugas";
}

export async function tambahKunjungan(input: TambahKunjunganInput): Promise<{
  success: boolean;
  data?: Kunjungan;
  error?: string;
}> {
  if (!input.nama || input.nama.trim().length === 0) {
    return { success: false, error: "Nama lengkap wajib diisi." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const today = getTodayWITA();

      // Get next nomor_urut for today
      const { data: existing } = await supabase
        .from("kunjungan")
        .select("nomor_urut")
        .eq("tanggal", today)
        .order("nomor_urut", { ascending: false })
        .limit(1);

      const nomorUrut = existing && existing.length > 0 ? existing[0].nomor_urut + 1 : 1;
      const { data: user } = await supabase.auth.getUser();

      const payload: any = {
        tanggal: today,
        nomor_urut: nomorUrut,
        nama: input.nama,
        jenis_kelamin: input.jenis_kelamin || "Laki-laki",
        no_telepon: input.no_telepon || null,
        instansi_id: input.instansi_id || null,
        instansi_lainnya: input.instansi_lainnya || null,
        bidang_id: input.bidang_id || null,
        keperluan: input.keperluan || null,
        jumlah_tamu: input.jumlah_tamu || 1,
        sumber: input.sumber,
        status: "menunggu_foto" as Status,
        consent: input.consent,
        dibuat_oleh: input.sumber === "petugas" && user?.user ? user.user.id : null,
        waktu_masuk: new Date().toISOString(),
      };

      let insertRes = await supabase
        .from("kunjungan")
        .insert(payload)
        .select(`
          *,
          instansi(id, nama),
          bidang(id, nama)
        `)
        .single();

      // Graceful fallback if database column jenis_kelamin hasn't been added yet
      if (insertRes.error && insertRes.error.message?.includes("jenis_kelamin")) {
        delete payload.jenis_kelamin;
        insertRes = await supabase
          .from("kunjungan")
          .insert(payload)
          .select(`
            *,
            instansi(id, nama),
            bidang(id, nama)
          `)
          .single();
      }

      const { data, error } = insertRes;

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath("/dashboard");
      return { success: true, data };
    } catch (err: any) {
      console.error("Supabase insert error:", err);
      return { success: false, error: err.message };
    }
  }

  // Demo fallback
  try {
    const data = mockStore.tambahKunjungan(input);
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan kunjungan." };
  }
}

export async function updateStatusKunjungan(id: string, status: Status) {
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
      return { success: true, data: data ?? [] };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  }

  return { success: true, data: mockStore.getKunjunganHariIni() };
}

export async function getKunjunganDetail(id: string): Promise<{
  success: boolean;
  data: Kunjungan | null;
  error?: string;
}> {
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

      // Resolve signed URLs for photo evidence from Supabase Storage
      if (data?.foto_kehadiran && data.foto_kehadiran.length > 0) {
        data.foto_kehadiran = await Promise.all(
          data.foto_kehadiran.map(async (foto: any) => {
            if (
              foto.storage_path &&
              !foto.storage_path.startsWith("http") &&
              !foto.storage_path.startsWith("data:")
            ) {
              // Try creating signed URL (24 hours validity)
              const { data: signedData } = await supabase.storage
                .from("foto-kehadiran")
                .createSignedUrl(foto.storage_path, 86400);

              if (signedData?.signedUrl) {
                return {
                  ...foto,
                  url: signedData.signedUrl,
                };
              }

              // Fallback to public URL
              const { data: publicUrlData } = supabase.storage
                .from("foto-kehadiran")
                .getPublicUrl(foto.storage_path);

              return {
                ...foto,
                url: publicUrlData?.publicUrl || foto.storage_path,
              };
            }
            return {
              ...foto,
              url: foto.url || foto.storage_path,
            };
          })
        );
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message, data: null };
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
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
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
        .order("nomor_urut", { ascending: true });

      if (instansiId) {
        query = query.eq("instansi_id", instansiId);
      }

      const { data, error } = await query;
      if (error) return { success: false, error: error.message, data: [] };
      return { success: true, data: data ?? [] };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  }

  return { success: true, data: mockStore.getKunjunganRekap(dari, sampai, instansiId) };
}

export async function editKunjungan(id: string, input: Partial<TambahKunjunganInput>) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const updateData: any = {
      nama: input.nama,
      no_telepon: input.no_telepon || null,
      instansi_id: input.instansi_id || null,
      instansi_lainnya: input.instansi_lainnya || null,
      bidang_id: input.bidang_id || null,
      keperluan: input.keperluan || null,
      jumlah_tamu: input.jumlah_tamu || 1,
    };
    if (input.jenis_kelamin) {
      updateData.jenis_kelamin = input.jenis_kelamin;
    }

    let { error } = await supabase.from("kunjungan").update(updateData).eq("id", id);
    if (error && error.message?.includes("jenis_kelamin")) {
      delete updateData.jenis_kelamin;
      const retry = await supabase.from("kunjungan").update(updateData).eq("id", id);
      error = retry.error;
    }

    if (error) return { success: false, error: error.message };
  } else {
    mockStore.editKunjungan(id, input as any);
  }

  revalidatePath(`/dashboard/detail/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function hapusKunjungan(id: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // 1. Ambil daftar file foto di storage yang terkait dengan kunjungan ini
      const { data: fotoList } = await supabase
        .from("foto_kehadiran")
        .select("storage_path")
        .eq("kunjungan_id", id);

      const pathsToDelete: string[] = [];
      if (fotoList && fotoList.length > 0) {
        fotoList.forEach((f: any) => {
          if (f.storage_path) {
            let p = f.storage_path;
            if (p.includes("foto-kehadiran/")) p = p.split("foto-kehadiran/")[1];
            if (p.includes("?")) p = p.split("?")[0];
            pathsToDelete.push(p.replace(/^\/+/, ""));
          }
        });
      }

      // Cek juga folder id di storage langsung jika ada file tersisa
      const { data: folderFiles } = await supabase.storage
        .from("foto-kehadiran")
        .list(id);

      if (folderFiles && folderFiles.length > 0) {
        folderFiles.forEach((file: any) => {
          const fp = `${id}/${file.name}`;
          if (!pathsToDelete.includes(fp)) pathsToDelete.push(fp);
        });
      }

      // 2. Hapus semua file fisik dari Supabase Storage
      if (pathsToDelete.length > 0) {
        const { error: storageDelErr } = await supabase.storage
          .from("foto-kehadiran")
          .remove(pathsToDelete);

        if (storageDelErr) {
          console.warn("Peringatan storage remove pada hapus kunjungan:", storageDelErr.message);
        }
      }

      // 3. Hapus data kunjungan dari database tabel
      const { error } = await supabase.from("kunjungan").delete().eq("id", id);
      if (error) return { success: false, error: error.message };

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/rekap");
      revalidatePath("/dashboard/berkas");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  } else {
    mockStore.hapusKunjungan(id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rekap");
  revalidatePath("/dashboard/berkas");
  return { success: true };
}
