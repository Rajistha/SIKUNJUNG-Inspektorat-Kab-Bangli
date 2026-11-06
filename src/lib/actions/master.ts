"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isDemoAllowed } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/store";
import { authorize } from "@/lib/session";
import { getInstansiAktifCached, getBidangAktifCached, MASTER_CACHE_TAG } from "@/lib/master-cache";
import { revalidatePath, revalidateTag } from "next/cache";
import type { Instansi, Bidang, User, Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "petugas"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function refreshMaster(path: string) {
  revalidateTag(MASTER_CACHE_TAG, "max");
  revalidatePath(path);
  revalidatePath("/tamu");
}

function dbError(message: string): string {
  return /duplicate key|unique/i.test(message) ? "Nama tersebut sudah terdaftar." : message;
}

export async function getInstansiList(activeOnly = true): Promise<Instansi[]> {
  if (isSupabaseConfigured()) {
    try {
      // Daftar aktif untuk form publik di-cache; daftar lengkap hanya untuk staf (tanpa cache).
      if (activeOnly) return await getInstansiAktifCached();

      const supabase = await createClient();
      const { data, error } = await supabase.from("instansi").select("*").order("nama");
      if (error) throw new Error(error.message);
      return (data ?? []) as Instansi[];
    } catch (err) {
      console.error("getInstansiList:", err);
      return isDemoAllowed() ? mockStore.getInstansi(activeOnly) : [];
    }
  }

  return isDemoAllowed() ? mockStore.getInstansi(activeOnly) : [];
}

export async function getBidangList(activeOnly = true): Promise<Bidang[]> {
  if (isSupabaseConfigured()) {
    try {
      if (activeOnly) return await getBidangAktifCached();

      const supabase = await createClient();
      const { data, error } = await supabase.from("bidang").select("*").order("urutan");
      if (error) throw new Error(error.message);
      return (data ?? []) as Bidang[];
    } catch (err) {
      console.error("getBidangList:", err);
      return isDemoAllowed() ? mockStore.getBidang(activeOnly) : [];
    }
  }

  return isDemoAllowed() ? mockStore.getBidang(activeOnly) : [];
}

export async function tambahInstansi(nama: string) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  const clean = nama?.trim();
  if (!clean) return { success: false, error: "Nama instansi tidak boleh kosong." };
  if (clean.length > 200) return { success: false, error: "Nama instansi terlalu panjang." };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("instansi").insert({ nama: clean, is_active: true });
    if (error) return { success: false, error: dbError(error.message) };
  } else {
    mockStore.addInstansi(clean);
  }

  refreshMaster("/dashboard/instansi");
  return { success: true };
}

export async function updateInstansi(id: string, nama: string, is_active: boolean) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  const clean = nama?.trim();
  if (!clean) return { success: false, error: "Nama instansi tidak boleh kosong." };
  if (clean.length > 200) return { success: false, error: "Nama instansi terlalu panjang." };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("instansi").update({ nama: clean, is_active }).eq("id", id);
    if (error) return { success: false, error: dbError(error.message) };
  } else {
    mockStore.updateInstansi(id, clean, is_active);
  }

  refreshMaster("/dashboard/instansi");
  return { success: true };
}

export async function tambahBidang(nama: string, urutan: number) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  const clean = nama?.trim();
  if (!clean) return { success: false, error: "Nama bidang tidak boleh kosong." };
  if (clean.length > 200) return { success: false, error: "Nama bidang terlalu panjang." };
  const order = Number.isFinite(urutan) ? Math.trunc(urutan) : 0;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("bidang").insert({ nama: clean, urutan: order, is_active: true });
    if (error) return { success: false, error: dbError(error.message) };
  } else {
    mockStore.addBidang(clean, order);
  }

  refreshMaster("/dashboard/bidang");
  return { success: true };
}

export async function updateBidang(id: string, nama: string, urutan: number, is_active: boolean) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  const clean = nama?.trim();
  if (!clean) return { success: false, error: "Nama bidang tidak boleh kosong." };
  if (clean.length > 200) return { success: false, error: "Nama bidang terlalu panjang." };
  const order = Number.isFinite(urutan) ? Math.trunc(urutan) : 0;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("bidang")
      .update({ nama: clean, urutan: order, is_active })
      .eq("id", id);
    if (error) return { success: false, error: dbError(error.message) };
  } else {
    mockStore.updateBidang(id, clean, order, is_active);
  }

  refreshMaster("/dashboard/bidang");
  return { success: true };
}

export async function getUserList(): Promise<User[]> {
  const auth = await authorize("admin");
  if (!auth.ok) return [];

  if (isSupabaseConfigured()) {
    try {
      const client = createAdminClient() ?? (await createClient());
      const { data, error } = await client.from("users").select("*").order("nama");
      if (error) throw new Error(error.message);
      return (data ?? []) as User[];
    } catch (err) {
      console.error("getUserList:", err);
      return [];
    }
  }

  return mockStore.getUsers();
}

export async function updateUser(
  id: string,
  updates: { nama?: string; role?: string; is_active?: boolean; password?: string }
) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  if (updates.role !== undefined && !ROLES.includes(updates.role as Role)) {
    return { success: false, error: "Role tidak valid." };
  }
  if (updates.nama !== undefined && (!updates.nama.trim() || updates.nama.length > 150)) {
    return { success: false, error: "Nama tidak valid." };
  }
  const newPassword = updates.password?.trim();
  if (newPassword && newPassword.length < MIN_PASSWORD) {
    return { success: false, error: `Password minimal ${MIN_PASSWORD} karakter.` };
  }

  // Cegah admin mengunci dirinya sendiri.
  if (id === auth.user.id && (updates.role === "petugas" || updates.is_active === false)) {
    return { success: false, error: "Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri." };
  }

  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (!adminClient) return { success: false, error: "Service role key belum dikonfigurasi." };

    if (newPassword) {
      const { error: passErr } = await adminClient.auth.admin.updateUserById(id, {
        password: newPassword,
      });
      if (passErr) return { success: false, error: `Gagal mengubah password: ${passErr.message}` };
    }

    const profileUpdates: { nama?: string; role?: string; is_active?: boolean } = {};
    if (updates.nama !== undefined) profileUpdates.nama = updates.nama.trim();
    if (updates.role !== undefined) profileUpdates.role = updates.role;
    if (updates.is_active !== undefined) profileUpdates.is_active = updates.is_active;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await adminClient.from("users").update(profileUpdates).eq("id", id);
      if (error) return { success: false, error: error.message };
    }

    // Akun nonaktif juga diblokir di Supabase Auth agar sesi/refresh token tidak bisa dipakai.
    if (updates.is_active !== undefined) {
      const { error: banErr } = await adminClient.auth.admin.updateUserById(id, {
        ban_duration: updates.is_active ? "none" : "876000h",
      });
      if (banErr) return { success: false, error: `Gagal memperbarui status akun: ${banErr.message}` };
    }
  } else {
    mockStore.updateUser(id, {
      ...(updates.nama !== undefined && { nama: updates.nama.trim() }),
      ...(updates.role !== undefined && { role: updates.role as Role }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
    });
  }

  revalidatePath("/dashboard/pengguna");
  return { success: true };
}

export async function tambahUser(email: string, password: string, nama: string, role: string) {
  const auth = await authorize("admin");
  if (!auth.ok) return { success: false, error: auth.error };

  const cleanEmail = email?.trim().toLowerCase();
  const cleanNama = nama?.trim();
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) return { success: false, error: "Format email tidak valid." };
  if (!cleanNama || cleanNama.length > 150) return { success: false, error: "Nama tidak valid." };
  if (!ROLES.includes(role as Role)) return { success: false, error: "Role tidak valid." };
  if (!password || password.length < MIN_PASSWORD) {
    return { success: false, error: `Password minimal ${MIN_PASSWORD} karakter.` };
  }

  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (!adminClient) return { success: false, error: "Service role key belum dikonfigurasi." };

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { nama: cleanNama },
    });
    if (authError) return { success: false, error: authError.message };

    const { error: profileError } = await adminClient.from("users").upsert({
      id: authData.user.id,
      nama: cleanNama,
      email: cleanEmail,
      role,
      is_active: true,
    });
    if (profileError) {
      // Hindari akun auth yatim tanpa profil.
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message };
    }
  } else {
    mockStore.addUser(cleanEmail, cleanNama, role as Role);
  }

  revalidatePath("/dashboard/pengguna");
  return { success: true };
}
