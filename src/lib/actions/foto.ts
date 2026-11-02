"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mockStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function simpanFoto(kunjunganId: string, fotoBase64: string, urutan: number) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${kunjunganId}/${urutan}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("foto-kehadiran")
        .upload(fileName, buffer, { contentType: "image/jpeg" });

      if (uploadError) return { success: false, error: uploadError.message };

      const { error: dbError } = await supabase.from("foto_kehadiran").insert({
        kunjungan_id: kunjunganId,
        storage_path: fileName,
        urutan,
        diambil_oleh: user ? user.id : null,
        diambil_pada: new Date().toISOString(),
      });

      if (dbError) return { success: false, error: dbError.message };

      // Update status kunjungan to 'tercatat'
      await supabase
        .from("kunjungan")
        .update({ status: "tercatat" })
        .eq("id", kunjunganId);

      revalidatePath(`/dashboard/detail/${kunjunganId}`);
      revalidatePath("/dashboard");
      return { success: true, path: fileName };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Demo fallback: store base64 in mock store
  const foto = mockStore.tambahFoto(kunjunganId, fotoBase64);
  if (!foto) {
    return { success: false, error: "Gagal menyimpan foto atau sudah mencapai batas 5 foto." };
  }

  revalidatePath(`/dashboard/detail/${kunjunganId}`);
  revalidatePath("/dashboard");
  return { success: true, foto };
}

export async function hapusFoto(fotoId: string, storagePath: string, kunjunganId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // Clean storage path to ensure relative bucket path without URLs or query tokens
      let cleanPath = storagePath;
      if (cleanPath.includes("foto-kehadiran/")) {
        cleanPath = cleanPath.split("foto-kehadiran/")[1];
      }
      if (cleanPath.includes("?")) {
        cleanPath = cleanPath.split("?")[0];
      }
      cleanPath = cleanPath.replace(/^\/+/, "");

      // 1. Delete physical file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("foto-kehadiran")
        .remove([cleanPath]);

      if (storageError) {
        console.warn("Peringatan storage remove:", storageError.message);
      }

      // 2. Delete record from database table
      await supabase.from("foto_kehadiran").delete().eq("id", fotoId);

      const { data: remaining } = await supabase
        .from("foto_kehadiran")
        .select("id")
        .eq("kunjungan_id", kunjunganId);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from("kunjungan")
          .update({ status: "menunggu_foto" })
          .eq("id", kunjunganId);
      }

      revalidatePath(`/dashboard/detail/${kunjunganId}`);
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/berkas");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  mockStore.hapusFoto(fotoId, kunjunganId);
  revalidatePath(`/dashboard/detail/${kunjunganId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/berkas");
  return { success: true };
}

export async function getFotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const result: Record<string, string> = {};
      for (const path of paths) {
        const { data } = await supabase.storage
          .from("foto-kehadiran")
          .createSignedUrl(path, 3600);
        if (data) result[path] = data.signedUrl;
      }
      return result;
    } catch {
      return {};
    }
  }

  return {};
}
