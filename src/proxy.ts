import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Hanya rute yang butuh sesi. Halaman publik (/tamu, /) tidak perlu round-trip auth.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
