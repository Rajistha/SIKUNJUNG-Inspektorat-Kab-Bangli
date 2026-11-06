import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isDemoAllowed } from "@/lib/supabase/client";
import type { User, Role } from "@/lib/types";

/**
 * Mengambil pengguna aktif yang sedang login. Di-cache per request sehingga
 * layout, page, dan server action tidak mengulang round-trip ke Supabase.
 * Mengembalikan null jika belum login, profil tidak ditemukan, atau akun dinonaktifkan.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Utamakan admin client agar tidak terpengaruh kebijakan RLS pada tabel users.
      const client = createAdminClient() ?? supabase;

      let { data } = await client.from("users").select("*").eq("id", user.id).maybeSingle();
      if (!data && user.email) {
        ({ data } = await client.from("users").select("*").eq("email", user.email).maybeSingle());
      }

      if (!data || !data.is_active) return null;
      return data as User;
    } catch (err) {
      console.error("Error in getSessionUser:", err);
      return null;
    }
  }

  if (!isDemoAllowed()) return null;

  const cookieStore = await cookies();
  const session = cookieStore.get("sikunjung_session");
  if (!session?.value) return null;

  try {
    return JSON.parse(session.value) as User;
  } catch {
    return null;
  }
});

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

/** Guard untuk server action: wajib login, opsional wajib role tertentu. */
export async function authorize(role?: Role): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login kembali." };
  if (role && user.role !== role) {
    return { ok: false, error: "Anda tidak memiliki izin untuk tindakan ini." };
  }
  return { ok: true, user };
}
