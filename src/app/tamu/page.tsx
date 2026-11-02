import React from "react";
import { getInstansiList, getBidangList } from "@/lib/actions/master";
import { KunjunganForm } from "@/components/kunjungan/KunjunganForm";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TamuPage() {
  const [instansiList, bidangList] = await Promise.all([
    getInstansiList(true),
    getBidangList(true),
  ]);

  return (
    <div className="min-h-screen bg-[#F4F5FD] flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-[480px] mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-6 shadow-[0_4px_20px_rgba(79,106,232,0.06)] mb-4 text-center">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showText={false} />
          </div>

          <h1 className="text-xl font-bold text-[#1F2547] tracking-tight">
            SIKUNJUNG
          </h1>
          <p className="text-xs font-semibold text-[#4F6AE8] uppercase tracking-wider mt-0.5">
            Buku Tamu Digital
          </p>
          <p className="text-xs text-[#8A90B0] mt-0.5">
            Inspektorat Daerah Kabupaten Bangli
          </p>

          <div className="mt-4 pt-3 border-t border-[#E6E8F5] text-left">
            <h2 className="text-sm font-semibold text-[#1F2547]">
              Formulir Kehadiran Tamu
            </h2>
            <p className="text-xs text-[#8A90B0] mt-0.5">
              Silakan isi data kunjungan Anda di bawah ini.
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-6 shadow-[0_4px_20px_rgba(79,106,232,0.06)]">
          <KunjunganForm
            instansiList={instansiList}
            bidangList={bidangList}
            sumber="qr"
          />
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#8A90B0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2FB67C]" />
            <span>Kunjungan tercatat resmi di sistem Pemkab Bangli</span>
          </div>

          <div>
            <Link
              href="/login"
              className="text-xs text-[#4F6AE8] hover:underline"
            >
              Masuk sebagai Petugas / Admin &rarr;
            </Link>
          </div>

          <div className="pt-3 border-t border-[#E6E8F5]/80 text-[11px] text-[#8A90B0]">
            Website by{" "}
            <a
              href="https://www.rajistha.my.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#4F6AE8] hover:underline"
            >
              Rajistha
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
