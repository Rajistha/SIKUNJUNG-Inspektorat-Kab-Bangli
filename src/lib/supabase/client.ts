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

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null as any;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
