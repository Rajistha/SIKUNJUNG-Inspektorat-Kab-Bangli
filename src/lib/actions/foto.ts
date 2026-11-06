"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mockStore } from "@/lib/store";
import { authorize } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { FOTO_BUCKET, cleanStoragePath } from "@/lib/storage-utils";

const MAX_FOTO = 5;
const MAX_BYTES = 5 * 1024 * 1024; // sama dengan batas bucket
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,/;

/**
 * Simpan satu foto. Nomor `urutan` ditentukan server (slot kosong terkecil 1..5),
 * sehingga mengulang penyimpanan setelah kegagalan sebagian tidak lagi bentrok.
 */
export async function simpanFoto(kunjunganId: string, fotoBase64: string) {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error };

  const match = DATA_URL_RE.exec(fotoBase64 ?? "");
  if (!match) return { success: false, error: "Format foto tidak valid (gunakan JPEG, PNG, atau WebP)." };

  if (isSupabaseConfigured()) {
    let uploadedPath: string | null = null;
    try {
      const buffer = Buffer.from(fotoBase64.slice(match[0].length), "base64");
      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
        return { success: false, error: "Ukuran foto tidak valid (maksimal 5 MB)." };
      }

      const supabase = await createClient();

      const { data: existing, error: listErr } = await supabase
        .from("foto_kehadiran")
        .select("urutan")
        .eq("kunjungan_id", kunjunganId);
      if (listErr) return { success: false, error: listErr.message };

      const used = new Set((existing ?? []).map((f) => f.urutan as number));
      let urutan = 0;
      for (let i = 1; i <= MAX_FOTO; i++) {
        if (!used.has(i)) {
          urutan = i;
          break;
        }
      }
      if (!urutan) return { success: false, error: `Batas maksimal ${MAX_FOTO} foto per kunjungan sudah tercapai.` };

      const ext = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
      const fileName = `${kunjunganId}/${urutan}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(FOTO_BUCKET)
        .upload(fileName, buffer, { contentType: match[1] });
      if (uploadError) return { success: false, error: uploadError.message };
      uploadedPath = fileName;

      // Status kunjungan menjadi 'tercatat' lewat trigger on_foto_inserted di database.
      const { error: dbError } = await supabase.from("foto_kehadiran").insert({
        kunjungan_id: kunjunganId,
        storage_path: fileName,
        urutan,
        diambil_oleh: auth.user.id,
        diambil_pada: new Date().toISOString(),
      });

      if (dbError) {
        // Jangan tinggalkan file yatim di storage.
        await supabase.storage.from(FOTO_BUCKET).remove([fileName]);
        uploadedPath = null;
        return { success: false, error: dbError.message };
      }

      revalidatePath(`/dashboard/detail/${kunjunganId}`);
      revalidatePath("/dashboard");
      return { success: true, path: fileName, urutan };
    } catch (err) {
      if (uploadedPath) {
        try {
          const supabase = await createClient();
          await supabase.storage.from(FOTO_BUCKET).remove([uploadedPath]);
        } catch {
          /* best effort */
        }
      }
      return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan foto." };
    }
  }

  // Demo fallback: simpan base64 di mock store
  const foto = mockStore.tambahFoto(kunjunganId, fotoBase64, auth.user.id);
  if (!foto) {
    return { success: false, error: "Gagal menyimpan foto atau sudah mencapai batas 5 foto." };
  }

  revalidatePath(`/dashboard/detail/${kunjunganId}`);
  revalidatePath("/dashboard");
  return { success: true, foto, urutan: foto.urutan };
}

export async function hapusFoto(fotoId: string, storagePath: string, kunjunganId: string) {
  const auth = await authorize();
  if (!auth.ok) return { success: false, error: auth.error };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // 1. Hapus catatan DB lebih dulu: jika gagal, file fisik tetap utuh dan konsisten.
      const { error: dbError } = await supabase
        .from("foto_kehadiran")
        .delete()
        .eq("id", fotoId)
        .eq("kunjungan_id", kunjunganId);
      if (dbError) return { success: false, error: dbError.message };

      // 2. Hapus file fisik. Status kembali ke 'menunggu_foto' ditangani trigger on_foto_deleted.
      const cleanPath = cleanStoragePath(storagePath);
      if (cleanPath) {
        const { error: storageError } = await supabase.storage.from(FOTO_BUCKET).remove([cleanPath]);
        if (storageError) console.warn("Peringatan storage remove:", storageError.message);
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus foto." };
    }
  } else {
    mockStore.hapusFoto(fotoId, kunjunganId);
  }

  revalidatePath(`/dashboard/detail/${kunjunganId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/berkas");
  return { success: true };
}

export async function getFotoUrls(paths: string[]): Promise<Record<string, string>> {
  const auth = await authorize();
  if (!auth.ok || !isSupabaseConfigured()) return {};

  try {
    const supabase = await createClient();
    const clean = paths.map((p) => cleanStoragePath(p)).filter((p): p is string => Boolean(p));
    if (clean.length === 0) return {};

    // Satu request batch, bukan satu per path.
    const { data } = await supabase.storage.from(FOTO_BUCKET).createSignedUrls(clean, 3600);
    const result: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
    }
    return result;
  } catch {
    return {};
  }
}
