"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/store";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User } from "@/lib/types";

export async function login(formData: FormData | { email: string; password: string }) {
  const email = typeof formData === "object" && "get" in formData
    ? (formData.get("email") as string)
    : formData.email;
  const password = typeof formData === "object" && "get" in formData
    ? (formData.get("password") as string)
    : formData.password;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    redirect("/dashboard");
  }

  // Demo fallback
  const normalizedEmail = email.toLowerCase().replace(/@bangli\.go\.id$/, "@banglikab.go.id");
  const user = mockStore.getUsers().find((u) => {
    const userNorm = u.email.toLowerCase().replace(/@bangli\.go\.id$/, "@banglikab.go.id");
    return userNorm === normalizedEmail || u.email.toLowerCase() === email.toLowerCase();
  });
  if (!user) {
    return { success: false, error: "Email tidak ditemukan atau akun tidak terdaftar." };
  }

  if (!user.is_active) {
    return { success: false, error: "Akun ini telah dinonaktifkan. Hubungi admin." };
  }

  const cookieStore = await cookies();
  cookieStore.set("sikunjung_session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/dashboard");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete("sikunjung_session");
  redirect("/login");
}

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Ambil profil user: utamakan admin client untuk menghindari bug rekursi RLS di Supabase
      const adminSupabase = createAdminClient();
      const client = adminSupabase || supabase;

      const { data } = await client
        .from("users")
        .select("*")
        .or(`id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (data) {
        return data as User;
      }

      // 2. Fallback darurat jika baris belum sempat terambil
      const isAdmin = user.email?.toLowerCase().includes("admin") ?? false;
      return {
        id: user.id,
        nama:
          (user.user_metadata?.nama as string) ||
          (isAdmin ? "Admin Inspektorat" : "Petugas"),
        email: user.email!,
        role: isAdmin ? "admin" : "petugas",
        is_active: true,
        created_at: user.created_at,
      };
    } catch (err) {
      console.error("Error in getCurrentUser:", err);
      return null;
    }
  }

  // Demo fallback
  const cookieStore = await cookies();
  const session = cookieStore.get("sikunjung_session");
  if (!session?.value) {
    return null;
  }

  try {
    return JSON.parse(session.value) as User;
  } catch {
    return null;
  }
}
