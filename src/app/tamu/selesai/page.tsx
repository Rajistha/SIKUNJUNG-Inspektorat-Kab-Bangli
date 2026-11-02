"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Camera, User, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNomorUrut, formatJam } from "@/lib/utils";

function SelesaiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const nomorParam = searchParams.get("nomor") || "1";
  const namaParam = searchParams.get("nama") || "Tamu";
  const jamParam = searchParams.get("jam") || new Date().toISOString();

  const nomorFormatted = formatNomorUrut(parseInt(nomorParam, 10) || 1);
  const jamFormatted = formatJam(jamParam);

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white rounded-[24px] border border-[#E6E8F5] p-8 shadow-[0_8px_30px_rgba(79,106,232,0.08)] text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-[#EDFAF4] border-2 border-[#2FB67C]/30 text-[#2FB67C] flex items-center justify-center mx-auto mb-5 shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-2xl font-bold text-[#1F2547] tracking-tight">
        Terima kasih, {namaParam}
      </h1>
      <p className="text-sm text-[#8A90B0] mt-1">
        Data kunjungan Anda telah berhasil tersimpan
      </p>

      {/* Large Queue Number Box */}
      <div className="my-6 p-6 rounded-[20px] bg-gradient-to-b from-[#EEF1FF] to-[#F4F5FD] border border-[#4F6AE8]/20">
        <span className="text-xs font-semibold text-[#4F6AE8] uppercase tracking-wider block">
          Nomor Urut Kunjungan Hari Ini
        </span>
        <div className="text-5xl font-extrabold text-[#4F6AE8] tracking-tight my-2 font-mono">
          {nomorFormatted}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#8A90B0]">
          <Clock className="w-3.5 h-3.5" />
          <span>Waktu masuk: Pukul {jamFormatted} WITA</span>
        </div>
      </div>

      {/* Critical Next Step Callout */}
      <div className="p-4 rounded-[16px] bg-amber-50 border border-amber-200 text-left flex items-start gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-amber-900">
            Langkah Selanjutnya: Foto Kehadiran
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
            Silakan lapor ke <strong>petugas</strong> di meja depan untuk pengambilan foto kehadiran resmi. Kunjungan Anda sah setelah petugas mengambil foto.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          onClick={() => router.push("/tamu")}
          className="w-full text-base font-semibold"
        >
          Isi untuk Tamu Lain
        </Button>
      </div>

      <div className="mt-8 pt-4 border-t border-[#E6E8F5] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A90B0] gap-2">
        <span>Inspektorat Daerah Kabupaten Bangli</span>
        <span>
          Website by{" "}
          <a
            href="https://www.rajistha.my.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#4F6AE8] hover:underline"
          >
            Rajistha
          </a>
        </span>
      </div>
    </div>
  );
}

export default function TamuSelesaiPage() {
  return (
    <div className="min-h-screen bg-[#F4F5FD] flex flex-col justify-center py-8 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center text-sm text-gray-500">Memuat...</div>}>
        <SelesaiContent />
      </Suspense>
    </div>
  );
}

