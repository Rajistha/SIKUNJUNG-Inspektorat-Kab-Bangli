"use client";

import React, { useState } from "react";
import { BerkasItem, BerkasFolder, hapusBerkas, hapusFolderBerkas } from "@/lib/actions/berkas";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  HardDrive,
  Search,
  Download,
  Trash2,
  ZoomIn,
  RefreshCw,
  FolderArchive,
  CheckCircle2,
  FileImage,
  Folder,
  FolderOpen,
  ArrowLeft,
  Calendar,
  Building2,
  ExternalLink,
  Cloud,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatTanggal } from "@/lib/utils";

interface BerkasClientProps {
  initialFolders: BerkasFolder[];
  initialFiles: BerkasItem[];
  totalBytes: number;
  maxBytes?: number;
}

export function BerkasClient({
  initialFolders,
  initialFiles,
  totalBytes,
  maxBytes = 1024 * 1024 * 1024, // 1 GB Supabase Free limit
}: BerkasClientProps) {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activePhoto, setActivePhoto] = useState<{ url: string; name: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ path: string; name: string } | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<BerkasFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Storage calculation for Supabase Free plan (1 GB)
  const usedPercent = Math.min(100, (totalBytes / maxBytes) * 100);
  const remainingBytes = Math.max(0, maxBytes - totalBytes);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const selectedFolder = initialFolders.find((f) => f.id === selectedFolderId);

  // Filter folders in root view
  const filteredFolders = initialFolders.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.namaTamu.toLowerCase().includes(q) ||
      f.instansiNama.toLowerCase().includes(q) ||
      (f.tanggal && f.tanggal.includes(q)) ||
      (f.nomorUrut && String(f.nomorUrut).includes(q)) ||
      (f.keperluan && f.keperluan.toLowerCase().includes(q))
    );
  });

  // Filter files if searching inside a folder
  const currentFiles = selectedFolder
    ? selectedFolder.files.filter((f) => {
        const q = search.toLowerCase();
        return f.name.toLowerCase().includes(q);
      })
    : [];

  const handleDownload = async (url?: string, name?: string) => {
    if (!url) return;
    try {
      toast.loading("Mengunduh berkas...", { id: "dl-berkas" });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name || "berkas-foto.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Berkas berhasil diunduh.", { id: "dl-berkas" });
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = name || "berkas-foto.jpg";
      a.click();
      toast.dismiss("dl-berkas");
    }
  };

  const handleDownloadAllInFolder = async (folder: BerkasFolder) => {
    if (folder.files.length === 0) {
      toast.error("Tidak ada berkas di dalam folder ini.");
      return;
    }
    toast.loading(`Mengunduh ${folder.files.length} foto tamu...`, { id: "dl-all" });
    for (let i = 0; i < folder.files.length; i++) {
      const file = folder.files[i];
      if (file.url) {
        await handleDownload(file.url, `${folder.namaTamu.replace(/\s+/g, "_")}_foto_${i + 1}.jpg`);
      }
    }
    toast.success("Semua foto berhasil diunduh.", { id: "dl-all" });
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await hapusBerkas(fileToDelete.path);
      if (!res.success) throw new Error(res.error || "Gagal menghapus berkas.");
      toast.success("Berkas fisik berhasil dihapus dari cloud storage.");
      setFileToDelete(null);
      router.refresh();
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "") || "Gagal menghapus berkas.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    setIsDeleting(true);
    try {
      const res = await hapusFolderBerkas(folderToDelete.id);
      if (!res.success) throw new Error(res.error || "Gagal menghapus folder.");
      toast.success("Seluruh berkas dalam folder berhasil dibersihkan.");
      setFolderToDelete(null);
      setSelectedFolderId(null);
      router.refresh();
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "") || "Gagal menghapus folder.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data arsip penyimpanan berhasil dimuat ulang.");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF1FF] text-[#4F6AE8] text-xs font-semibold mb-2">
            <Cloud className="w-3.5 h-3.5" /> Supabase Storage Explorer
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2547] flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 text-[#4F6AE8]" />
            Arsip Penyimpanan Berkas
          </h1>
          <p className="text-xs sm:text-sm text-[#8A90B0] mt-1">
            Kelola berkas bukti foto kehadiran tamu yang terorganisir per folder kunjungan secara terstruktur.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="gap-2 text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Muat Ulang
        </Button>
      </div>

      {/* 2. Three Metric Cards (Including Free Plan 1GB Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Berkas & Folder */}
        <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
              Total Berkas
            </span>
            <div className="text-2xl font-extrabold text-[#1F2547] mt-1 font-mono">
              {initialFiles.length} File
            </div>
            <span className="text-[11px] text-[#8A90B0] mt-0.5 inline-block">
              Tersimpan dalam <strong>{initialFolders.length}</strong> folder kunjungan
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EEF1FF] text-[#4F6AE8] flex items-center justify-center shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Ruang Terpakai (Supabase Free Plan 1 GB) */}
        <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
                  Ruang Terpakai
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Maks. 1 GB
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#1F2547] mt-1 font-mono flex items-baseline gap-1.5">
                <span>{formatSize(totalBytes)}</span>
                <span className="text-xs font-semibold text-[#8A90B0] font-sans">/ 1 GB</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>

          {/* Progress Bar for Supabase Free 1GB Limit */}
          <div className="mt-3">
            <div className="w-full bg-[#E6E8F5] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPercent > 90
                    ? "bg-red-500"
                    : usedPercent > 70
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-[#4F6AE8] to-[#6881F7]"
                }`}
                style={{ width: `${Math.max(1, Math.min(100, usedPercent))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-[#8A90B0] mt-1.5">
              <span>{usedPercent < 0.01 ? "< 0.01%" : `${usedPercent.toFixed(2)}%`} terpakai</span>
              <span>Sisa: {formatSize(remainingBytes)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Status Cloud Bucket */}
        <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#2FB67C] uppercase tracking-wider">
              Status Penyimpanan
            </span>
            <div className="text-lg font-bold text-[#2FB67C] mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Cloud Storage Aktif
            </div>
            <span className="text-[11px] text-[#8A90B0] mt-0.5 inline-block">
              Bucket: <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">foto-kehadiran</code>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Breadcrumb & Toolbar */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Breadcrumb indicator */}
        <div className="flex items-center gap-2 text-sm">
          {selectedFolder ? (
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setSearch("");
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#4F6AE8] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Semua Folder
            </button>
          ) : (
            <span className="font-bold text-[#1F2547] text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#4F6AE8]" />
              Semua Folder Kunjungan
            </span>
          )}

          {selectedFolder && (
            <>
              <span className="text-[#8A90B0]">/</span>
              <span className="font-bold text-[#1F2547] truncate max-w-[200px] sm:max-w-xs flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                {selectedFolder.namaTamu}
              </span>
            </>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8A90B0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              selectedFolder
                ? "Cari nama file dalam folder ini..."
                : "Cari nama tamu, instansi, tanggal..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#F4F5FD] border border-transparent text-base sm:text-sm text-[#1F2547] placeholder:text-[#8A90B0] focus:bg-white focus:border-[#4F6AE8] focus:ring-2 focus:ring-[#4F6AE8]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. MAIN CONTENT: ROOT VIEW (FOLDERS) OR FOLDER DETAIL VIEW */}
      {!selectedFolder ? (
        /* ================= ROOT VIEW: GRID OF FOLDERS ================= */
        <div>
          {filteredFolders.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-12 text-center text-[#8A90B0]">
              <Folder className="w-12 h-12 mx-auto text-[#8A90B0]/30 mb-3" />
              <p className="text-base font-semibold text-[#1F2547]">Tidak ada folder ditemukan</p>
              <p className="text-xs text-[#8A90B0] mt-1">
                {search
                  ? "Tidak ada folder kunjungan yang cocok dengan pencarian Anda."
                  : "Belum ada berkas foto kehadiran yang diunggah ke sistem."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setSearch("");
                  }}
                  className="group bg-white rounded-[18px] border border-[#E6E8F5] hover:border-[#4F6AE8]/60 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left relative overflow-hidden"
                >
                  {/* Top Header of Folder Card */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#EEF1FF] to-[#E0E7FF] text-[#4F6AE8] border border-[#CCD2F0]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Folder className="w-6 h-6 fill-[#4F6AE8]/20" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF1FF] text-[#4F6AE8]">
                          {folder.files.length} Foto
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-[#555C82]">
                          {formatSize(folder.totalBytes)}
                        </span>
                      </div>
                    </div>

                    {/* Visitor Name & Info */}
                    <h3 className="text-base font-bold text-[#1F2547] group-hover:text-[#4F6AE8] transition-colors line-clamp-1">
                      {folder.namaTamu}
                    </h3>

                    <div className="mt-2 space-y-1.5 text-xs text-[#555C82]">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <Building2 className="w-3.5 h-3.5 text-[#8A90B0] shrink-0" />
                        <span className="truncate">{folder.instansiNama}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#8A90B0]">
                        <Calendar className="w-3.5 h-3.5 text-[#8A90B0] shrink-0" />
                        <span>
                          {folder.tanggal ? formatTanggal(folder.tanggal) : "Hari Ini"}
                          {folder.nomorUrut ? ` • Antrean #${folder.nomorUrut}` : ""}
                        </span>
                      </div>

                      {folder.keperluan && (
                        <p className="text-[11px] text-[#8A90B0] italic line-clamp-1 pt-0.5">
                          &ldquo;{folder.keperluan}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer Action */}
                  <div className="mt-4 pt-3.5 border-t border-[#F0F2FC] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4F6AE8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Buka Folder Foto &rarr;
                    </span>
                    {folder.kunjunganId && (
                      <Link
                        href={`/dashboard/detail/${folder.kunjunganId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-[#8A90B0] hover:text-[#4F6AE8] hover:underline flex items-center gap-1"
                      >
                        Detail Tamu <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= INSIDE FOLDER VIEW: PHOTOS GRID ================= */
        <div className="space-y-4">
          {/* Active Folder Header Card */}
          <div className="bg-white rounded-[18px] border border-[#CCD2F0] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF1FF] text-[#4F6AE8] flex items-center justify-center shrink-0">
                <FolderOpen className="w-7 h-7 text-[#4F6AE8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Folder Kunjungan
                  </span>
                  {selectedFolder.nomorUrut && (
                    <span className="text-xs font-bold text-[#4F6AE8]">
                      Antrean #{selectedFolder.nomorUrut}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-[#1F2547] mt-1">
                  {selectedFolder.namaTamu}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#555C82] mt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#8A90B0]" />
                    {selectedFolder.instansiNama}
                  </span>
                  {selectedFolder.tanggal && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8A90B0]" />
                      {formatTanggal(selectedFolder.tanggal)}
                    </span>
                  )}
                  <span>
                    Total: <strong>{selectedFolder.files.length} Foto</strong> ({formatSize(selectedFolder.totalBytes)})
                  </span>
                </div>
              </div>
            </div>

            {/* Folder Actions */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadAllInFolder(selectedFolder)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Semua Foto
              </Button>

              {selectedFolder.kunjunganId && (
                <Link href={`/dashboard/detail/${selectedFolder.kunjunganId}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold text-[#4F6AE8] hover:bg-[#EEF1FF] cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" /> Lihat di Buku Tamu
                  </Button>
                </Link>
              )}

              <Button
                variant="danger"
                size="sm"
                onClick={() => setFolderToDelete(selectedFolder)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Folder
              </Button>
            </div>
          </div>

          {/* Photos Grid inside Folder */}
          {currentFiles.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-12 text-center text-[#8A90B0]">
              <FileImage className="w-12 h-12 mx-auto text-[#8A90B0]/30 mb-3" />
              <p className="text-base font-semibold text-[#1F2547]">Tidak ada file foto</p>
              <p className="text-xs text-[#8A90B0] mt-1">
                Folder ini belum memiliki berkas foto atau tidak cocok dengan filter pencarian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentFiles.map((file, idx) => (
                <div
                  key={file.fullPath || idx}
                  className="group bg-white rounded-[14px] border border-[#E6E8F5] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Photo Preview Container */}
                  <div
                    onClick={() =>
                      file.url && setActivePhoto({ url: file.url, name: file.name })
                    }
                    className="relative aspect-4/3 bg-gray-100 overflow-hidden cursor-pointer"
                  >
                    {file.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8A90B0]">
                        <FileImage className="w-8 h-8 opacity-40" />
                      </div>
                    )}

                    {/* Hover Zoom Badge */}
                    <div className="absolute inset-0 bg-[#1F2547]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-full bg-white text-[#1F2547] shadow-lg hover:scale-110 transition-transform">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                      Foto #{idx + 1}
                    </span>
                  </div>

                  {/* File Metadata & Actions */}
                  <div className="p-3">
                    <p className="text-xs font-bold text-[#1F2547] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#8A90B0] mt-0.5">
                      {formatSize(file.size || 0)}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-[#F0F2FC] flex items-center justify-between gap-1">
                      <button
                        onClick={() => handleDownload(file.url, file.name)}
                        className="flex-1 py-1 px-2 rounded-lg bg-[#F4F5FD] hover:bg-[#EEF1FF] text-[#4F6AE8] text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Unduh foto ini"
                      >
                        <Download className="w-3 h-3" /> Unduh
                      </button>

                      <button
                        onClick={() =>
                          setFileToDelete({ path: file.fullPath, name: file.name })
                        }
                        className="p-1 rounded-lg text-[#8A90B0] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus foto dari storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PREVIEW FOTO / LIGHTBOX */}
      <Dialog
        isOpen={!!activePhoto}
        onClose={() => setActivePhoto(null)}
        title={activePhoto?.name || "Preview Foto Kehadiran"}
        description="Bukti kehadiran fisik tamu resmi yang tersimpan di cloud storage."
      >
        <div className="space-y-4">
          <div className="relative rounded-[16px] overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
            {activePhoto?.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activePhoto.url}
                alt={activePhoto.name}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#8A90B0] truncate max-w-sm">
              {activePhoto?.name}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(activePhoto?.url, activePhoto?.name)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Foto
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActivePhoto(null)}
                className="text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* MODAL 2: KONFIRMASI HAPUS SINGLE FILE */}
      <Dialog
        isOpen={!!fileToDelete}
        onClose={() => !isDeleting && setFileToDelete(null)}
        title="Hapus Berkas dari Penyimpanan"
        description="Apakah Anda yakin ingin menghapus berkas fisik ini secara permanen dari Supabase Storage?"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-800">
            <p className="font-semibold">Peringatan Penghapusan Fisik:</p>
            <p className="mt-1">
              File <strong>{fileToDelete?.name}</strong> akan langsung dihapus dari bucket cloud storage dan tidak dapat dipulihkan kembali.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setFileToDelete(null)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDeleteFile}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Permanen
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL 3: KONFIRMASI HAPUS SELURUH FOLDER */}
      <Dialog
        isOpen={!!folderToDelete}
        onClose={() => !isDeleting && setFolderToDelete(null)}
        title="Hapus Seluruh Foto Dalam Folder"
        description="Tindakan ini akan menghapus semua file foto kehadiran milik tamu ini dari cloud storage."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-800">
            <p className="font-semibold">Hapus Folder Tamu: {folderToDelete?.namaTamu}</p>
            <p className="mt-1">
              Sebanyak <strong>{folderToDelete?.files.length} file foto</strong> di dalam folder ini akan dihapus permanen dari Supabase Storage.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setFolderToDelete(null)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDeleteFolder}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Membersihkan...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Ya, Bersihkan Folder
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
