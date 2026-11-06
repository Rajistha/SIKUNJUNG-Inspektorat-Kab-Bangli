"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Printer,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  ShieldCheck,
} from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";

export function QrDisplayClient() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [tamuUrl, setTamuUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const standeeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const targetUrl = `${origin}/tamu`;
    let cancelled = false;

    // QR resolusi tinggi dengan warna navy
    QRCode.toDataURL(targetUrl, {
      width: 1000,
      margin: 1.5,
      color: {
        dark: "#1F2547",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (cancelled) return;
        setTamuUrl(targetUrl);
        setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setTamuUrl(targetUrl);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = () => {
    if (!tamuUrl) return;
    navigator.clipboard.writeText(tamuUrl);
    setCopied(true);
    toast.success("Tautan form tamu berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Download the ENTIRE standee card as a high-resolution PNG image
  const handleDownloadStandee = async () => {
    if (!standeeRef.current) return;
    setIsDownloading(true);
    try {
      const node = standeeRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        style: {
          margin: "0",
          transform: "none",
          maxWidth: "none",
          width: `${width}px`,
          height: `${height}px`,
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "Standee-Buku-Tamu-SIKUNJUNG-Bangli.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Gambar standee berhasil diunduh utuh!");
    } catch (err) {
      console.error("Gagal mengunduh gambar standee:", err);
      toast.error("Gagal mengunduh standee. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Actions Header (Hidden when printed) */}
      <div className="print:hidden bg-white rounded-[16px] sm:rounded-[20px] border border-[#E6E8F5] p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1F2547]">
            QR Code Meja Resepsionis & Standee
          </h1>
          <p className="text-xs text-[#8A90B0] mt-1">
            Cetak untuk ditempatkan pada akrilik meja tamu resepsionis, atau unduh gambar standee untuk keperluan cetak.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full sm:w-auto gap-1.5 cursor-pointer text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2FB67C]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin!" : "Salin Link"}
          </Button>

          <a href={tamuUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full gap-1.5 cursor-pointer text-xs">
              <ExternalLink className="w-3.5 h-3.5" /> Buka Form
            </Button>
          </a>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadStandee}
            isLoading={isDownloading}
            className="w-full sm:w-auto gap-1.5 cursor-pointer text-xs font-semibold text-[#4F6AE8] border-[#4F6AE8]/30 hover:bg-[#EEF1FF]"
          >
            <Download className="w-3.5 h-3.5" /> Unduh PNG
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="w-full sm:w-auto gap-1.5 font-semibold shadow-sm cursor-pointer text-xs bg-[#4F6AE8] hover:bg-[#3B52C4]"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Standee
          </Button>
        </div>
      </div>

      {/* Official Dignified Government Standee (Target for Print & Download) */}
      <div
        id="printable-standee"
        ref={standeeRef}
        className="mx-auto w-full max-w-[480px] bg-white rounded-[20px] sm:rounded-[24px] border border-[#CCD2F0] p-6 sm:p-8 md:p-9 shadow-[0_8px_30px_rgba(31,37,71,0.06)]"
      >
        {/* Official Government Kop */}
        <div className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <Logo size="md" showText={false} />
            <div className="text-left">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#4F6AE8]">
                Pemerintah Kabupaten Bangli
              </h2>
              <h1 className="text-base sm:text-lg font-extrabold text-[#1F2547] leading-tight tracking-tight">
                INSPEKTORAT DAERAH
              </h1>
              <p className="text-[10px] text-[#8A90B0]">
                Jl. Brigjen Ngurah Rai No. 30, Bangli, Bali 80613
              </p>
            </div>
          </div>

          {/* Elegant Double Line Divider */}
          <div className="mt-3 space-y-0.5">
            <div className="h-[1.5px] bg-[#1F2547] w-full" />
            <div className="h-[0.5px] bg-[#8A90B0]/40 w-full" />
          </div>
        </div>

        {/* Title & Welcome Message */}
        <div className="text-center my-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1F2547] tracking-tight">
            BUKU TAMU DIGITAL
          </h3>
          <p className="text-xs text-[#555C82] mt-1 max-w-xs mx-auto leading-relaxed">
            Selamat datang di Inspektorat Daerah Kabupaten Bangli. Silakan scan kode QR di bawah ini untuk mengisi buku tamu.
          </p>
        </div>

        {/* Clean, Professional QR Code Frame */}
        <div className="flex flex-col items-center justify-center my-5">
          <div className="bg-white p-4 rounded-[18px] border border-[#CCD2F0] shadow-sm">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="QR Code Buku Tamu SIKUNJUNG"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
              />
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-gray-400">
                <QrCode className="w-16 h-16 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-[#4F6AE8] mt-3">
            Arahkan kamera ponsel Anda ke kode QR
          </p>
        </div>

        {/* Minimalist 3-Step Flow */}
        <div className="my-5 py-2.5 px-3 rounded-[12px] bg-[#F8F9FE] border border-[#E6E8F5] text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-[#555C82] flex-wrap">
            <span className="font-semibold text-[#1F2547]">1. Pindai QR</span>
            <span className="text-[#8A90B0]">&bull;</span>
            <span className="font-semibold text-[#1F2547]">2. Isi Data Diri</span>
            <span className="text-[#8A90B0]">&bull;</span>
            <span className="font-semibold text-[#1F2547]">3. Konfirmasi Petugas</span>
          </div>
        </div>

        {/* Standee Official Footer */}
        <div className="pt-3 border-t border-[#E6E8F5] flex items-center justify-between text-[10px] text-[#8A90B0]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2FB67C] shrink-0" />
            <span>Pelayanan Berintegritas & Transparan</span>
          </div>
          <span className="font-medium text-[#555C82]">SIKUNJUNG Inspektorat Kabupaten Bangli</span>
        </div>
      </div>
    </div>
  );
}
