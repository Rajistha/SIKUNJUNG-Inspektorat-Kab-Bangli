import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (!url.startsWith("https://")) return false;
  if (url.includes("your-project") || url.includes("xxxxxxxxxxxx") || url.includes("ganti-dengan-project-anda")) return false;
  if (key.includes("your-anon-key") || key.includes("ganti-dengan-anon-key-anda")) return false;
  return true;
}

/**
 * Mode demo (cookie sesi tanpa tanda tangan + data in-memory) hanya boleh aktif
 * saat development, atau jika ALLOW_DEMO_MODE=true diset secara eksplisit.
 * Di produksi dengan env Supabase yang salah/kosong, aplikasi gagal tertutup
 * (tidak ada yang bisa login) alih-alih membuka mode demo yang mudah dipalsukan.
 */
export function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_MODE === "true";
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
