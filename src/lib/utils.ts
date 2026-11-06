import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Status } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mengambil tanggal hari ini sesuai zona waktu WITA (Kabupaten Bangli, Bali / UTC+8)
export function getTodayWITA(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function formatTanggal(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

const WITA = "Asia/Makassar";

// Format jam/tanggal selalu dalam WITA agar hasil render server (UTC) dan browser konsisten.
const jamFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: WITA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const tanggalJamFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: WITA,
  day: "numeric",
  month: "short",
  year: "numeric",
});

function toDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatJam(dateStr: string): string {
  const d = toDate(dateStr);
  return d ? jamFormatter.format(d) : dateStr;
}

export function formatTanggalJam(dateStr: string): string {
  const d = toDate(dateStr);
  return d ? `${tanggalJamFormatter.format(d)}, ${jamFormatter.format(d)}` : dateStr;
}

export function formatNomorUrut(nomor: number): string {
  return `#${String(nomor).padStart(3, "0")}`;
}

export function maskTelepon(telepon?: string): string {
  if (!telepon || telepon.length < 6) return telepon ?? "-";
  const visible = 3;
  const end = telepon.slice(-3);
  const masked = "x".repeat(telepon.length - visible - 3);
  return telepon.slice(0, visible) + masked + end;
}

export function statusLabel(status: Status): string {
  const map: Record<Status, string> = {
    menunggu_foto: "Menunggu foto",
    tercatat: "Tercatat",
    tidak_diverifikasi: "Tidak diverifikasi",
  };
  return map[status];
}

export function statusColor(status: Status): {
  bg: string;
  text: string;
  dot: string;
} {
  const map: Record<Status, { bg: string; text: string; dot: string }> = {
    menunggu_foto: {
      bg: "bg-warning-soft",
      text: "text-yellow-800",
      dot: "bg-warning",
    },
    tercatat: {
      bg: "bg-success-soft",
      text: "text-green-800",
      dot: "bg-success",
    },
    tidak_diverifikasi: {
      bg: "bg-danger-soft",
      text: "text-red-800",
      dot: "bg-danger",
    },
  };
  return map[status];
}

export function compressImage(
  file: File,
  targetKB = 300
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal kompres gambar"));
            if (blob.size <= targetKB * 1024 || quality <= 0.3) {
              resolve(blob);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Kompres foto (maks. 1200px, ~targetKB) lalu kembalikan sebagai data URL JPEG. */
export async function compressImageToDataUrl(file: File, targetKB = 400): Promise<string> {
  const blob = await compressImage(file, targetKB);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca gambar"));
    reader.readAsDataURL(blob);
  });
}
