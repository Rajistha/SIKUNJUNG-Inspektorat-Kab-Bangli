"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Instansi, Kunjungan } from "@/lib/types";
import { getKunjunganRekap } from "@/lib/actions/kunjungan";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  formatNomorUrut,
  formatTanggal,
  formatJam,
  maskTelepon,
} from "@/lib/utils";
import {
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { exportKunjunganToExcel, exportKunjunganToPdf } from "@/lib/export-utils";

interface RekapClientProps {
  instansiList: Instansi[];
}

export function RekapClient({ instansiList }: RekapClientProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // First day of current month as default start date
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];

  const [dariTanggal, setDariTanggal] = useState(firstDayOfMonth);
  const [sampaiTanggal, setSampaiTanggal] = useState(todayStr);
  const [selectedInstansi, setSelectedInstansi] = useState("");
  const [search, setSearch] = useState("");

  const [kunjunganList, setKunjunganList] = useState<Kunjungan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRekap = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getKunjunganRekap(
        dariTanggal,
        sampaiTanggal,
        selectedInstansi || undefined
      );
      if (res.success) {
        setKunjunganList(res.data);
      } else {
        toast.error(res.error || "Gagal memuat data rekap.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, [dariTanggal, sampaiTanggal, selectedInstansi]);

  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  const filtered = kunjunganList.filter((k) => {
    if (!search.trim()) return true;
    return (
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      (k.instansi?.nama || k.instansi_lainnya || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (k.keperluan || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    try {
      exportKunjunganToExcel(filtered, {
        title: "LAPORAN REKAPITULASI BUKU TAMU DIGITAL (SIKUNJUNG)",
        subtitle: `${formatTanggal(dariTanggal)} s/d ${formatTanggal(sampaiTanggal)}`,
        filenamePrefix: `Rekap_SIKUNJUNG_${dariTanggal}_sd_${sampaiTanggal}`,
      });
      toast.success("File Excel resmi berhasil diunduh!");
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
      toast.loading("Menyiapkan dokumen PDF resmi...", { id: "pdf-gen" });
      exportKunjunganToPdf(filtered, {
        title: "LAPORAN REKAPITULASI BUKU TAMU DIGITAL (SIKUNJUNG)",
        subtitle: `${formatTanggal(dariTanggal)} s/d ${formatTanggal(sampaiTanggal)}`,
        filenamePrefix: `Laporan_SIKUNJUNG_${dariTanggal}_sd_${sampaiTanggal}`,
      });
      toast.success("Dokumen PDF resmi berhasil diunduh!", { id: "pdf-gen" });
    } catch {
      toast.error("Gagal mengunduh dokumen PDF.", { id: "pdf-gen" });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Title & Export Actions */}
      <div className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#E6E8F5] p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1F2547]">
            Rekap & Laporan Kunjungan
          </h1>
          <p className="text-xs text-[#8A90B0] mt-1">
            Filter riwayat tamu berdasarkan rentang tanggal dan unduh file Excel atau PDF resmi untuk laporan pimpinan.
          </p>
        </div>

        {/* Dual Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto shrink-0">
          <Button
            onClick={handleExportExcel}
            disabled={filtered.length === 0 || isLoading}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer text-xs h-10"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" /> Unduh Excel (.xlsx)
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={filtered.length === 0 || isLoading}
            className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer text-xs h-10"
          >
            <FileText className="w-4 h-4 shrink-0" /> Unduh PDF (.pdf)
          </Button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E6E8F5] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DatePicker
            label="Dari Tanggal"
            value={dariTanggal}
            onChange={setDariTanggal}
            placeholder="Pilih tanggal mulai"
          />

          <DatePicker
            label="Sampai Tanggal"
            value={sampaiTanggal}
            onChange={setSampaiTanggal}
            placeholder="Pilih tanggal akhir"
          />

          <div>
            <Select
              label="Filter Instansi"
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

          <div>
            <label className="text-xs font-semibold text-[#1F2547] block mb-1.5">
              Cari Nama / Keperluan
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A90B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ketik kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-[10px] bg-[#F4F5FD] border border-transparent text-base sm:text-sm text-[#1F2547] focus:bg-white focus:border-[#4F6AE8] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-[#E6E8F5] text-xs text-[#8A90B0] gap-2">
          <span>
            Menampilkan <strong>{filtered.length}</strong> data kunjungan dari total <strong>{kunjunganList.length}</strong>
          </span>
          <button
            onClick={fetchRekap}
            className="flex items-center gap-1.5 text-[#4F6AE8] hover:underline font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Perbarui Data
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E6E8F5] overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-[#8A90B0]">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-[#8A90B0]/40 mb-3" />
            <p className="text-base font-semibold text-[#1F2547]">Tidak ada data pada periode ini</p>
            <p className="text-xs text-[#8A90B0] mt-1">
              Coba sesuaikan rentang tanggal atau bersihkan filter pencarian.
            </p>
          </div>
        ) : (
          <div>
            {/* Tampilan Mobile: Kartu Rekap (md:hidden) */}
            <div className="md:hidden divide-y divide-[#E6E8F5]">
              {filtered.map((item, idx) => (
                <div key={item.id} className="p-3.5 bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#4F6AE8] bg-[#EEF1FF] px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-medium text-[#8A90B0]">
                        {item.tanggal} &bull; {formatJam(item.waktu_masuk)} WITA
                      </span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mb-2.5">
                    <div className="font-semibold text-sm text-[#1F2547] flex items-center gap-1.5 flex-wrap">
                      <span>{item.nama}</span>
                      {item.jumlah_tamu > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#4F6AE8] font-medium text-[10px]">
                          +{item.jumlah_tamu - 1} orang
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#52597A] mt-1 space-y-0.5">
                      <div className="font-medium text-[#1F2547]">
                        {item.instansi?.nama || item.instansi_lainnya || "-"}
                      </div>
                      {item.bidang?.nama && (
                        <div className="text-[11px] text-[#8A90B0]">
                          Tujuan: {item.bidang.nama}
                        </div>
                      )}
                      {item.keperluan && (
                        <div className="text-xs text-[#6B7280] italic mt-1 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          &ldquo;{item.keperluan}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6E8F5]/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8A90B0] font-mono">
                      Bukti foto: <strong className="text-[#1F2547]">{item.foto_kehadiran?.length || 0}</strong>
                    </span>
                    <Link
                      href={`/dashboard/detail/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#CCD2F0] text-xs font-semibold text-[#4F6AE8] hover:bg-[#EEF1FF] hover:border-[#4F6AE8] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Detail</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Desktop: Tabel Lengkap (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[880px]">
                <thead>
                  <tr className="bg-[#F8F9FE] border-b border-[#E6E8F5] text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12">No</th>
                    <th className="py-3.5 px-4 w-28">Tanggal</th>
                    <th className="py-3.5 px-4 w-20">Jam</th>
                    <th className="py-3.5 px-4">Nama Tamu</th>
                    <th className="py-3.5 px-4">Asal Instansi</th>
                    <th className="py-3.5 px-4">Bidang</th>
                    <th className="py-3.5 px-4">Keperluan</th>
                    <th className="py-3.5 px-4 w-28">Status</th>
                    <th className="py-3.5 px-4 text-center w-20">Foto</th>
                    <th className="py-3.5 px-4 text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E8F5]">
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-[#8A90B0]">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#1F2547] whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8A90B0] whitespace-nowrap">
                        {formatJam(item.waktu_masuk)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1F2547]">
                          {item.nama}
                        </span>
                        {item.jumlah_tamu > 1 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-[#4F6AE8] text-[10px] whitespace-nowrap">
                            +{item.jumlah_tamu - 1} orang
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#1F2547]">
                        {item.instansi?.nama || item.instansi_lainnya || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#1F2547]">
                        {item.bidang?.nama || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8A90B0] max-w-xs truncate">
                        {item.keperluan || "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#1F2547]">
                          {item.foto_kehadiran?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/detail/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#CCD2F0] text-xs font-semibold text-[#4F6AE8] hover:bg-[#EEF1FF] hover:border-[#4F6AE8] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Detail</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
