export const FOTO_BUCKET = "foto-kehadiran";

/**
 * Normalisasi path objek storage: buang prefix bucket, query token, dan slash awal.
 * Mengembalikan null jika path mencurigakan (traversal / kosong).
 */
export function cleanStoragePath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.split("?")[0];
  if (p.includes(`${FOTO_BUCKET}/`)) p = p.split(`${FOTO_BUCKET}/`).pop() ?? "";
  p = p.replace(/^\/+/, "").trim();
  if (!p || p.split("/").some((seg) => seg === ".." || seg === ".")) return null;
  return p;
}

/** Jalankan tugas async dengan batas paralelisme (untuk menghindari ratusan request berurutan). */
export async function mapInChunks<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}
