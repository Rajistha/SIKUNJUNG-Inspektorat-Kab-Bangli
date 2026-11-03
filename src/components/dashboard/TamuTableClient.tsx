"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Kunjungan, Instansi } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  formatNomorUrut,
  formatJam,
  maskTelepon,
} from "@/lib/utils";
import {
  Search,
  Camera,
  Eye,
  Filter,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Users,
  Clock,
  CheckCircle,
  Building2,
  Calendar,
  Mars,
  Venus,
  MessageCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { exportKunjunganToExcel, exportKunjunganToPdf } from "@/lib/export-utils";

interface TamuTableClientProps {
  initialKunjungan: Kunjungan[];
  instansiList: Instansi[];
  userName: string;
}

export function TamuTableClient({
  initialKunjungan,
  instansiList,
  userName,
}: TamuTableClientProps) {
  const [search, setSearch] = useState("");
  const [selectedInstansi, setSelectedInstansi] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Summary counts
  const totalTamu = initialKunjungan.length;
  const menungguFotoCount = initialKunjungan.filter(
    (k) => k.status === "menunggu_foto"
  ).length;
  const tercatatCount = initialKunjungan.filter(
    (k) => k.status === "tercatat"
  ).length;

  // Filtered list
  const filtered = useMemo(() => {
    return initialKunjungan.filter((k) => {
      // Search by name
      const matchSearch =
        !search.trim() ||
        k.nama.toLowerCase().includes(search.toLowerCase()) ||
        (k.instansi?.nama || k.instansi_lainnya || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      // Filter by instansi
      const matchInstansi =
        !selectedInstansi || k.instansi_id === selectedInstansi;

      // Filter by status
      const matchStatus =
        selectedStatus === "all" || k.status === selectedStatus;

      return matchSearch && matchInstansi && matchStatus;
    });
  }, [initialKunjungan, search, selectedInstansi, selectedStatus]);

  // Export functions using official export utils
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    try {
      exportKunjunganToExcel(filtered, {
        title: "DAFTAR TAMU HARIAN (SIKUNJUNG)",
        subtitle: `Tamu Hari Ini (${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })})`,
        filenamePrefix: "Tamu_Hari_Ini_SIKUNJUNG",
      });
      toast.success("File Excel berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh file Excel.");
    }
  };

  const handleExportPdf = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    try {
      toast.loading("Menyiapkan dokumen PDF...", { id: "pdf-today" });
      exportKunjunganToPdf(filtered, {
        title: "DAFTAR TAMU HARIAN (SIKUNJUNG)",
        subtitle: `Tamu Hari Ini (${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })})`,
        filenamePrefix: "Tamu_Hari_Ini_SIKUNJUNG",
      });
      toast.success("Dokumen PDF berhasil diunduh!", { id: "pdf-today" });
    } catch {
      toast.error("Gagal mengunduh dokumen PDF.", { id: "pdf-today" });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* 1. Banner Sapaan (Mobile Optimized) */}
      <div className="w-full rounded-[18px] sm:rounded-[20px] bg-gradient-to-r from-[#4F6AE8] to-[#3B52C4] text-white p-4 sm:p-6 shadow-md shadow-[#4F6AE8]/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm p-1 sm:p-1.5 flex items-center justify-center shrink-0 border border-white/20 shadow-inner mt-0.5 sm:mt-0">
            <img src="/logo.svg" alt="SIKUNJUNG" className="w-full h-full object-contain drop-shadow" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-white/80 font-medium block leading-tight">
              Resepsionis & Pengawasan • Inspektorat Bangli
            </span>
            <h2 className="text-base sm:text-2xl font-bold mt-1 text-white leading-snug break-words" title={userName}>
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1 leading-normal break-words">
              {menungguFotoCount > 0 ? (
                <>
                  Ada <strong className="underline underline-offset-2">{menungguFotoCount} tamu</strong> yang sedang menunggu pengambilan foto kehadiran.
                </>
              ) : (
                "Semua tamu hari ini telah difoto dan tercatat resmi."
              )}
            </p>
          </div>
        </div>

        {menungguFotoCount > 0 && (
          <button
            onClick={() => {
              setSelectedStatus("menunggu_foto");
              const el = document.getElementById("tabel-tamu");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full lg:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-[12px] bg-white text-[#4F6AE8] font-bold text-xs sm:text-sm hover:bg-[#EEF1FF] transition-all shadow-sm shrink-0 text-center cursor-pointer mt-1 lg:mt-0"
          >
            Lihat Antrean Foto ({menungguFotoCount})
          </button>
        )}
      </div>

      {/* 2. Tiga Kartu Ringkasan (Compact 3-Column on Mobile) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Card 1: Tamu Hari Ini */}
        <div className="bg-white rounded-[14px] sm:rounded-[16px] border border-[#E6E8F5] p-3 sm:p-5 shadow-[0_4px_16px_rgba(79,106,232,0.06)] flex flex-col sm:flex-row sm:items-center sm:justify-between justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-[#8A90B0] uppercase tracking-wider block truncate">
              Tamu Hari Ini
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-[#1F2547] mt-0.5 sm:mt-1 font-mono">
              {totalTamu}
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#8A90B0] hidden sm:block">Total kunjungan</span>
          </div>
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-[#EEF1FF] text-[#4F6AE8] flex items-center justify-center shrink-0 self-end sm:self-auto mt-1 sm:mt-0">
            <Users className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Menunggu Foto */}
        <div className="bg-white rounded-[14px] sm:rounded-[16px] border border-[#E6E8F5] p-3 sm:p-5 shadow-[0_4px_16px_rgba(79,106,232,0.06)] flex flex-col sm:flex-row sm:items-center sm:justify-between justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider block truncate">
              Menunggu Foto
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-amber-600 mt-0.5 sm:mt-1 font-mono">
              {menungguFotoCount}
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#8A90B0] hidden sm:block">Perlu dipotret</span>
          </div>
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 self-end sm:self-auto mt-1 sm:mt-0">
            <Clock className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Tercatat Sah */}
        <div className="bg-white rounded-[14px] sm:rounded-[16px] border border-[#E6E8F5] p-3 sm:p-5 shadow-[0_4px_16px_rgba(79,106,232,0.06)] flex flex-col sm:flex-row sm:items-center sm:justify-between justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-[#2FB67C] uppercase tracking-wider block truncate">
              Tercatat Sah
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-[#2FB67C] mt-0.5 sm:mt-1 font-mono">
              {tercatatCount}
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#8A90B0] hidden sm:block">Ada bukti foto</span>
          </div>
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-[#EDFAF4] text-[#2FB67C] flex items-center justify-center shrink-0 self-end sm:self-auto mt-1 sm:mt-0">
            <CheckCircle className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Action Toolbar */}
      <div id="tabel-tamu" className="relative z-40 bg-white rounded-[16px] border border-[#E6E8F5] p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 text-[#8A90B0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#F4F5FD] border border-transparent text-base sm:text-sm text-[#1F2547] placeholder:text-[#8A90B0] focus:bg-white focus:border-[#4F6AE8] focus:ring-2 focus:ring-[#4F6AE8]/15 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto relative z-30">
          {/* Dropdown Filters */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            {/* Instansi Filter */}
            <div className="w-full sm:w-56 relative z-40">
              <Select
                sizeVariant="sm"
                value={selectedInstansi}
                onChange={(e) => setSelectedInstansi(e.target.value)}
                placeholder="Semua Instansi"
              >
                <option value="">Semua Instansi</option>
                {instansiList.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nama}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 relative z-30">
              <Select
                sizeVariant="sm"
                align="right"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                placeholder="Semua Status"
              >
                <option value="all">Semua Status</option>
                <option value="menunggu_foto">Menunggu Foto</option>
                <option value="tercatat">Tercatat</option>
                <option value="tidak_diverifikasi">Tidak Diverifikasi</option>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              className="w-full sm:w-auto gap-1.5 h-9 sm:h-10 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 cursor-pointer justify-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span> Excel
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPdf}
              className="w-full sm:w-auto gap-1.5 h-9 sm:h-10 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 cursor-pointer justify-center"
            >
              <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Table / Cards List */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] overflow-hidden shadow-[0_4px_16px_rgba(79,106,232,0.06)]">
        {filtered.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-[#8A90B0]">
            <Users className="w-12 h-12 mx-auto text-[#8A90B0]/40 mb-3" />
            <p className="text-base font-semibold text-[#1F2547]">Belum ada tamu hari ini</p>
            <p className="text-xs text-[#8A90B0] mt-1">
              {search || selectedInstansi || selectedStatus !== "all"
                ? "Tidak ada data yang sesuai filter pencarian Anda."
                : "Tamu yang scan QR atau diinput resepsionis akan langsung muncul di sini."}
            </p>
          </div>
        ) : (
          <>
            {/* A. TAMPILAN MOBILE: KARTU TAMU RESPONSIVE (md:hidden) */}
            <div className="md:hidden divide-y divide-[#E6E8F5]">
              {filtered.map((item) => {
                const isMenunggu = item.status === "menunggu_foto";
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors ${
                      isMenunggu ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    {/* Header: Nomor Urut, Jam, Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#4F6AE8] bg-[#EEF1FF] px-2 py-0.5 rounded-md">
                          {formatNomorUrut(item.nomor_urut)}
                        </span>
                        <span className="text-[11px] font-medium text-[#8A90B0]">
                          {formatJam(item.waktu_masuk)} WITA
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Nama Tamu & Gender */}
                    <div className="mb-2">
                      <div className="font-semibold text-sm text-[#1F2547] flex items-center gap-1.5 flex-wrap">
                        <span>{item.nama}</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            item.jenis_kelamin?.toLowerCase().includes("perempuan")
                              ? "bg-[#FFEBEB] text-[#E5484D] border border-[#E5484D]/20"
                              : "bg-[#EEF1FF] text-[#4F6AE8] border border-[#4F6AE8]/20"
                          }`}
                        >
                          {item.jenis_kelamin?.toLowerCase().includes("perempuan") ? (
                            <Venus className="w-2.5 h-2.5 text-[#E5484D]" />
                          ) : (
                            <Mars className="w-2.5 h-2.5 text-[#4F6AE8]" />
                          )}
                          {item.jenis_kelamin || "Laki-laki"}
                        </span>
                        {item.jumlah_tamu > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#4F6AE8] font-medium text-[10px]">
                            {item.jumlah_tamu} org
                          </span>
                        )}
                      </div>

                      {/* Asal Instansi & Bidang */}
                      <div className="text-xs text-[#52597A] mt-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#8A90B0] shrink-0" />
                          <span className="truncate font-medium">{item.instansi?.nama || item.instansi_lainnya || "-"}</span>
                        </div>
                        {item.bidang?.nama && (
                          <div className="text-[11px] text-[#8A90B0] pl-5 truncate">
                            Tujuan: {item.bidang.nama}
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Shortcut */}
                      {item.no_telepon && (
                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={`https://wa.me/${item.no_telepon.replace(/\D/g, "").replace(/^0/, "62")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Hubungi WA ({maskTelepon(item.no_telepon)})</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Mobile */}
                    <div className="pt-2 border-t border-[#E6E8F5]/80">
                      {isMenunggu ? (
                        <Link href={`/dashboard/foto/${item.id}`} className="block w-full">
                          <Button
                            size="sm"
                            className="w-full gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm h-9 justify-center cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Ambil Foto Kehadiran
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/detail/${item.id}`} className="block w-full">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full gap-1.5 text-xs font-semibold h-9 justify-center cursor-pointer border-[#CCD2F0] hover:bg-[#EEF1FF] text-[#4F6AE8]"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Detail Kunjungan
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* B. TAMPILAN DESKTOP: TABEL LENGKAP (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[760px]">
                <thead>
                  <tr className="bg-[#F8F9FE] border-b border-[#E6E8F5] text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16">No.</th>
                    <th className="py-3.5 px-4 w-24">Jam</th>
                    <th className="py-3.5 px-4">Nama Tamu</th>
                    <th className="py-3.5 px-4">Asal Instansi</th>
                    <th className="py-3.5 px-4">Tujuan Bidang</th>
                    <th className="py-3.5 px-4 w-36">Status</th>
                    <th className="py-3.5 px-4 text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E8F5]">
                  {filtered.map((item) => {
                    const isMenunggu = item.status === "menunggu_foto";

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-gray-50/80 ${
                          isMenunggu ? "bg-amber-50/40" : ""
                        }`}
                      >
                        {/* Nomor Urut */}
                        <td className="py-4 px-4 font-mono font-bold text-[#4F6AE8]">
                          {formatNomorUrut(item.nomor_urut)}
                        </td>

                        {/* Jam */}
                        <td className="py-4 px-4 text-xs font-medium text-[#8A90B0]">
                          {formatJam(item.waktu_masuk)} WITA
                        </td>

                        {/* Nama & Jumlah */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#1F2547] flex items-center gap-1.5 flex-wrap">
                            <span>{item.nama}</span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                item.jenis_kelamin?.toLowerCase().includes("perempuan")
                                  ? "bg-[#FFEBEB] text-[#E5484D] border border-[#E5484D]/20"
                                  : "bg-[#EEF1FF] text-[#4F6AE8] border border-[#4F6AE8]/20"
                              }`}
                              title={`Jenis Kelamin: ${item.jenis_kelamin || "Laki-laki"}`}
                            >
                              {item.jenis_kelamin?.toLowerCase().includes("perempuan") ? (
                                <Venus className="w-2.5 h-2.5 text-[#E5484D]" />
                              ) : (
                                <Mars className="w-2.5 h-2.5 text-[#4F6AE8]" />
                              )}
                              {item.jenis_kelamin || "Laki-laki"}
                            </span>
                          </div>
                          <div className="text-xs text-[#8A90B0] flex items-center gap-2 mt-1 flex-wrap">
                            {item.jumlah_tamu > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#4F6AE8] font-medium text-[10px]">
                                Rombongan ({item.jumlah_tamu} orang)
                              </span>
                            )}
                            <span>Tel: {maskTelepon(item.no_telepon)}</span>
                            {item.no_telepon && (
                              <a
                                href={`https://wa.me/${item.no_telepon.replace(/\D/g, "").replace(/^0/, "62")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                                title={`Hubungi ${item.nama} via WhatsApp`}
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>Hubungi WA</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Instansi */}
                        <td className="py-4 px-4 text-[#1F2547]">
                          <div className="line-clamp-2 text-xs font-medium">
                            {item.instansi?.nama || item.instansi_lainnya || "-"}
                          </div>
                        </td>

                        {/* Tujuan Bidang */}
                        <td className="py-4 px-4 text-xs text-[#1F2547]">
                          {item.bidang?.nama || "-"}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Aksi */}
                        <td className="py-4 px-4 text-right">
                          {isMenunggu ? (
                            <Link href={`/dashboard/foto/${item.id}`}>
                              <Button
                                size="sm"
                                className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm h-8 cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5" /> Ambil Foto
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/dashboard/detail/${item.id}`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1.5 text-xs font-medium h-8 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Lihat Detail
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

