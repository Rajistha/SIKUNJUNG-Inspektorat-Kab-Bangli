"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isDemoAllowed } from "@/lib/supabase/client";
import { mockStore } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User } from "@/lib/types";

export async function login(formData: FormData | { email: string; password: string }) {
  const email = (
    formData instanceof FormData ? (formData.get("email") as string) : formData.email
  )?.trim();
  const password =
    formData instanceof FormData ? (formData.get("password") as string) : formData.password;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: "Email atau password salah." };

    // Akun yang dinonaktifkan atau tanpa profil tidak boleh masuk.
    const profile = await getSessionUser();
    if (!profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Akun ini tidak aktif atau belum terdaftar. Hubungi admin.",
      };
    }

    redirect("/dashboard");
  }

  if (!isDemoAllowed()) {
    return { success: false, error: "Layanan belum dikonfigurasi. Hubungi admin." };
  }

  // Demo fallback (hanya development / ALLOW_DEMO_MODE=true)
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
  return getSessionUser();
}
