import Link from "next/link";
import { QrCode, LogIn, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D9DAFB] via-[#F4F5FD] to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[24px] border border-[#E6E8F5] p-8 shadow-[0_8px_30px_rgba(79,106,232,0.12)] text-center">
        {/* Logo Badge */}
        <div className="flex justify-center mb-6">
          <Logo size="xl" showText={false} />
        </div>

        <h1 className="text-2xl font-bold text-[#1F2547] tracking-tight mb-1">
          SIKUNJUNG
        </h1>
        <p className="text-sm font-semibold text-[#4F6AE8] mb-1">
          Buku Tamu Digital
        </p>
        <p className="text-xs text-[#8A90B0] mb-8">
          Inspektorat Daerah Kabupaten Bangli
        </p>

        <div className="space-y-3.5">
          {/* Action 1: Form Tamu (QR) */}
          <Link
            href="/tamu"
            className="flex items-center justify-between p-4 rounded-[16px] bg-[#EEF1FF] border border-[#4F6AE8]/20 hover:bg-[#4F6AE8] hover:text-white group transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white group-hover:bg-white/20 text-[#4F6AE8] group-hover:text-white flex items-center justify-center shadow-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1F2547] group-hover:text-white">
                  Saya Pengunjung / Tamu
                </h2>
                <p className="text-xs text-[#8A90B0] group-hover:text-white/80">
                  Isi buku tamu & dapatkan nomor urut
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#4F6AE8] group-hover:text-white group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Action 2: Login Petugas */}
          <Link
            href="/login"
            className="flex items-center justify-between p-4 rounded-[16px] bg-white border border-[#E6E8F5] hover:border-[#4F6AE8] hover:bg-gray-50 group transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-[#EEF1FF] text-gray-700 group-hover:text-[#4F6AE8] flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1F2547]">
                  Petugas / Admin
                </h2>
                <p className="text-xs text-[#8A90B0]">
                  Masuk ke dashboard pengawasan
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4F6AE8] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E6E8F5] text-[11px] text-[#8A90B0]">
          Pemerintah Kabupaten Bangli &bull; Inspektorat Daerah
        </div>
      </div>
    </div>
  );
}
