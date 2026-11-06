import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Instansi, Bidang } from "@/lib/types";

// Klien anon tanpa cookie: data publik (instansi/bidang aktif) boleh di-cache lintas request.
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const MASTER_CACHE_TAG = "master-data";

export const getInstansiAktifCached = unstable_cache(
  async (): Promise<Instansi[]> => {
    const { data, error } = await publicClient()
      .from("instansi")
      .select("*")
      .eq("is_active", true)
      .order("nama");
    if (error) throw new Error(error.message);
    return (data ?? []) as Instansi[];
  },
  ["instansi-aktif"],
  { revalidate: 300, tags: [MASTER_CACHE_TAG] }
);

export const getBidangAktifCached = unstable_cache(
  async (): Promise<Bidang[]> => {
    const { data, error } = await publicClient()
      .from("bidang")
      .select("*")
      .eq("is_active", true)
      .order("urutan");
    if (error) throw new Error(error.message);
    return (data ?? []) as Bidang[];
  },
  ["bidang-aktif"],
  { revalidate: 300, tags: [MASTER_CACHE_TAG] }
);
