"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function getInstansiList(activeOnly = true) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase.from("instansi").select("*").order("nama");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) return mockStore.getInstansi(activeOnly);
      return data ?? [];
    } catch {
      return mockStore.getInstansi(activeOnly);
    }
  }

  return mockStore.getInstansi(activeOnly);
}

export async function getBidangList(activeOnly = true) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase.from("bidang").select("*").order("urutan");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) return mockStore.getBidang(activeOnly);
      return data ?? [];
    } catch {
      return mockStore.getBidang(activeOnly);
    }
  }

  return mockStore.getBidang(activeOnly);
}

export async function tambahInstansi(nama: string) {
  if (!nama || nama.trim().length === 0) {
    return { success: false, error: "Nama instansi tidak boleh kosong." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("instansi").insert({ nama, is_active: true });
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.addInstansi(nama);
  }

  revalidatePath("/dashboard/instansi");
  return { success: true };
}

export async function updateInstansi(id: string, nama: string, is_active: boolean) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("instansi").update({ nama, is_active }).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.updateInstansi(id, nama, is_active);
  }

  revalidatePath("/dashboard/instansi");
  return { success: true };
}

export async function tambahBidang(nama: string, urutan: number) {
  if (!nama || nama.trim().length === 0) {
    return { success: false, error: "Nama bidang tidak boleh kosong." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("bidang").insert({ nama, urutan, is_active: true });
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.addBidang(nama, urutan);
  }

  revalidatePath("/dashboard/bidang");
  return { success: true };
}

export async function updateBidang(id: string, nama: string, urutan: number, is_active: boolean) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("bidang").update({ nama, urutan, is_active }).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    mockStore.updateBidang(id, nama, urutan, is_active);
  }

  revalidatePath("/dashboard/bidang");
  return { success: true };
}

export async function getUserList() {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient.from("users").select("*").order("nama");
        if (!error && data) return data;
      }
      const supabase = await createClient();
      const { data, error } = await supabase.from("users").select("*").order("nama");
      if (error) return mockStore.getUsers();
      return data ?? [];
    } catch {
      return mockStore.getUsers();
    }
  }

  return mockStore.getUsers();
}

export async function updateUser(
  id: string,
  updates: { nama?: string; role?: string; is_active?: boolean; password?: string }
) {
  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    const client = adminClient || (await createClient());

    // If password provided, update auth user password
    if (updates.password && updates.password.trim().length >= 6 && adminClient) {
      const { error: passErr } = await adminClient.auth.admin.updateUserById(id, {
        password: updates.password.trim(),
      });
      if (passErr) console.warn("Update auth password warning:", passErr.message);
    }

    const profileUpdates: { nama?: string; role?: string; is_active?: boolean } = {};
    if (updates.nama !== undefined) profileUpdates.nama = updates.nama;
    if (updates.role !== undefined) profileUpdates.role = updates.role;
    if (updates.is_active !== undefined) profileUpdates.is_active = updates.is_active;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await client.from("users").update(profileUpdates).eq("id", id);
      if (error) return { success: false, error: error.message };
    }
  } else {
    mockStore.updateUser(id, updates as any);
  }

  revalidatePath("/dashboard/pengguna");
  return { success: true };
}

export async function tambahUser(email: string, password: string, nama: string, role: string) {
  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (!adminClient) return { success: false, error: "Service role key belum dikonfigurasi." };

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama },
    });
    if (authError) return { success: false, error: authError.message };

    const { error: profileError } = await adminClient.from("users").upsert({
      id: authData.user.id,
      nama,
      email,
      role,
      is_active: true,
    });
    if (profileError) return { success: false, error: profileError.message };
  } else {
    mockStore.addUser(email, nama, role as any);
  }

  revalidatePath("/dashboard/pengguna");
  return { success: true };
}
