"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Kunjungan, User } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  formatNomorUrut,
  formatTanggalJam,
  formatJam,
} from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  Edit2,
  Trash2,
  Building2,
  Layers,
  Phone,
  Clock,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  Users,
  ZoomIn,
  Mars,
  Venus,
  Download,
  MessageCircle,
  X,
} from "lucide-react";
import { editKunjungan, hapusKunjungan } from "@/lib/actions/kunjungan";
import { hapusFoto } from "@/lib/actions/foto";
import toast from "react-hot-toast";
import Link from "next/link";

interface DetailKunjunganClientProps {
  kunjungan: Kunjungan;
  currentUser: User | null;
}

export function DetailKunjunganClient({
  kunjungan,
  currentUser,
}: DetailKunjunganClientProps) {
  const router = useRouter();
  const isAdmin = currentUser?.role === "admin";

  // Lightbox modal state
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNama, setEditNama] = useState(kunjungan.nama);
  const [editJenisKelamin, setEditJenisKelamin] = useState(kunjungan.jenis_kelamin || "Laki-laki");
  const [editTelepon, setEditTelepon] = useState(kunjungan.no_telepon || "");
  const [editKeperluan, setEditKeperluan] = useState(kunjungan.keperluan || "");
  const [editJumlah, setEditJumlah] = useState(String(kunjungan.jumlah_tamu || 1));
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo delete modal state (No browser confirm!)
  const [fotoToDelete, setFotoToDelete] = useState<{ id: string; storagePath: string; urutan: number } | null>(null);
  const [isDeletingFoto, setIsDeletingFoto] = useState(false);

  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      toast.loading("Mengunduh foto...", { id: "dl-photo" });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Foto berhasil diunduh.", { id: "dl-photo" });
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = filename;
      a.click();
      toast.dismiss("dl-photo");
    }
  };

  const handleDownloadAllPhotos = async () => {
    const list = kunjungan.foto_kehadiran || [];
    if (list.length === 0) return;
    toast.success(`Mengunduh ${list.length} bukti foto...`);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const url = f.url || f.storage_path;
      const fn = `Bukti-Foto-SIKUNJUNG-${kunjungan.nomor_urut}-${i + 1}.jpg`;
      await handleDownloadPhoto(url, fn);
    }
  };

  const handleConfirmDeleteFoto = async () => {
    if (!fotoToDelete) return;
    setIsDeletingFoto(true);
    try {
      const res = await hapusFoto(fotoToDelete.id, fotoToDelete.storagePath, kunjungan.id);
      if (!res.success) throw new Error(res.error || "Gagal menghapus foto.");
      toast.success("Foto berhasil dihapus dari sistem dan penyimpanan.");
      setFotoToDelete(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus foto.");
    } finally {
      setIsDeletingFoto(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNama.trim()) {
      toast.error("Nama wajib diisi.");
      return;
    }
    if (!editKeperluan.trim()) {
      toast.error("Keperluan kunjungan wajib diisi.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await editKunjungan(kunjungan.id, {
        nama: editNama.trim(),
        jenis_kelamin: editJenisKelamin as any,
        no_telepon: editTelepon.trim() || undefined,
        keperluan: editKeperluan.trim(),
        jumlah_tamu: parseInt(editJumlah) || 1,
      });

      if (!res.success) throw new Error(res.error || "Gagal mengupdate.");
      toast.success("Data kunjungan berhasil diperbarui!");
      setIsEditOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteKunjungan = async () => {
    setIsDeleting(true);
    try {
      const res = await hapusKunjungan(kunjungan.id);
      if (!res.success) throw new Error(res.error || "Gagal menghapus.");
      toast.success("Kunjungan berhasil dihapus.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kunjungan.");
      setIsDeleting(false);
    }
  };

  const photos = kunjungan.foto_kehadiran || [];
  const canAddMorePhotos = photos.length < 5;

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/dashboard");
              }
            }}
            className="p-2 rounded-xl text-[#8A90B0] hover:text-[#1F2547] hover:bg-[#EEF1FF] transition-colors cursor-pointer shrink-0"
            title="Kembali ke halaman sebelumnya"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs sm:text-sm text-[#4F6AE8] bg-[#EEF1FF] px-2.5 py-0.5 rounded-full">
                {formatNomorUrut(kunjungan.nomor_urut)}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-[#1F2547]">
                Detail Kunjungan
              </h1>
              <StatusBadge status={kunjungan.status} />
            </div>
            <p className="text-[11px] sm:text-xs text-[#8A90B0] mt-1 truncate">
              ID Kunjungan: <span className="font-mono">{kunjungan.id}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5 flex-1 sm:flex-initial justify-center h-9 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Data
          </Button>

          {canAddMorePhotos && (
            <Link href={`/dashboard/foto/${kunjungan.id}`} className="flex-1 sm:flex-initial">
              <Button size="sm" className="gap-1.5 font-semibold w-full justify-center h-9 text-xs">
                <Camera className="w-3.5 h-3.5" /> Tambah Foto ({photos.length}/5)
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5 flex-1 sm:flex-initial justify-center h-9 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Data on Left, Photo Gallery on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Visitor Info */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1F2547] mb-4 pb-3 border-b border-[#E6E8F5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4F6AE8]" /> Informasi Pengunjung
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-[#8A90B0] block">Nama Lengkap</span>
                <span className="text-base font-bold text-[#1F2547]">
                  {kunjungan.nama}
                </span>
                {kunjungan.jumlah_tamu > 1 && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#4F6AE8] text-xs font-semibold">
                    Rombongan ({kunjungan.jumlah_tamu} orang)
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-[#8A90B0] block">Jenis Kelamin</span>
                <span className="text-sm font-semibold text-[#1F2547] mt-0.5 inline-flex items-center gap-1.5">
                  {kunjungan.jenis_kelamin?.toLowerCase().includes("perempuan") ? (
                    <>
                      <Venus className="w-4 h-4 text-[#E5484D]" />
                      <span>Perempuan</span>
                    </>
                  ) : (
                    <>
                      <Mars className="w-4 h-4 text-[#4F6AE8]" />
                      <span>Laki-laki</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#8A90B0] block">Nomor Telepon / WhatsApp</span>
                {kunjungan.no_telepon ? (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-sm text-[#1F2547] font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#2FB67C]" />
                      {kunjungan.no_telepon}
                    </span>
                    <a
                      href={`https://wa.me/${kunjungan.no_telepon.replace(/\D/g, "").replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                      title="Hubungi tamu via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hubungi WA</span>
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-[#8A90B0] mt-0.5 block">-</span>
                )}
              </div>

              <div>
                <span className="text-xs text-[#8A90B0] block">Asal Instansi / Lembaga</span>
                <span className="text-sm font-semibold text-[#1F2547] flex items-start gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-[#8A90B0] shrink-0 mt-0.5" />
                  {kunjungan.instansi?.nama || kunjungan.instansi_lainnya || "-"}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#8A90B0] block">Bidang / Pejabat Tujuan</span>
                <span className="text-sm font-medium text-[#1F2547] flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-4 h-4 text-[#8A90B0]" />
                  {kunjungan.bidang?.nama || "-"}
                </span>
              </div>

              <div>
                <span className="text-xs text-[#8A90B0] block">Keperluan</span>
                <p className="text-sm text-[#1F2547] bg-[#F4F5FD] p-3 rounded-[12px] mt-1">
                  {kunjungan.keperluan || "Tidak dicantumkan"}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E6E8F5] space-y-2 text-xs text-[#8A90B0]">
                <div className="flex items-center justify-between">
                  <span>Waktu Masuk Server:</span>
                  <span className="font-medium text-[#1F2547]">
                    {formatTanggalJam(kunjungan.waktu_masuk)} WITA
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Jalur Pendaftaran:</span>
                  <span className="font-semibold uppercase tracking-wider text-[#4F6AE8]">
                    {kunjungan.sumber === "qr" ? "Scan QR Tamu" : "Petugas"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Persetujuan Data Pribadi:</span>
                  <span className="inline-flex items-center gap-1 text-[#2FB67C] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Photo Evidence Gallery */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E6E8F5] flex-wrap gap-2">
              <h2 className="text-base font-semibold text-[#1F2547] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#4F6AE8]" /> Bukti Foto Kehadiran ({photos.length}/5)
              </h2>
              <div className="flex items-center gap-2">
                {photos.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadAllPhotos}
                    className="gap-1 text-xs text-[#1F2547] hover:text-[#4F6AE8] border-[#CCD2F0]"
                  >
                    <Download className="w-3 h-3" /> Unduh Semua
                  </Button>
                )}
                {canAddMorePhotos && (
                  <Link href={`/dashboard/foto/${kunjungan.id}`}>
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Camera className="w-3 h-3" /> Ambil Foto Tambahan
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="p-10 rounded-[16px] bg-amber-50/60 border border-dashed border-amber-200 text-center">
                <Camera className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-amber-900">
                  Belum Ada Foto Kehadiran
                </h3>
                <p className="text-xs text-amber-700 max-w-sm mx-auto mt-1 mb-4">
                  Kunjungan ini berstatus <em>Menunggu Foto</em>. Ambil foto menggunakan kamera tablet/laptop petugas untuk mengesahkan kehadiran.
                </p>
                <Link href={`/dashboard/foto/${kunjungan.id}`}>
                  <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm">
                    <Camera className="w-4 h-4" /> Buka Kamera Sekarang
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photos.map((foto, idx) => {
                  const imgUrl = foto.url || foto.storage_path;

                  return (
                    <div
                      key={foto.id}
                      className="group relative rounded-[16px] overflow-hidden border border-[#E6E8F5] bg-black aspect-video shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Foto kehadiran ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => setActivePhoto(imgUrl)}
                      />

                      {/* Photo Badge & Actions Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono backdrop-blur-md">
                            Foto #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPhoto(
                                  imgUrl,
                                  `Bukti-Foto-SIKUNJUNG-${kunjungan.nomor_urut}-${idx + 1}.jpg`
                                );
                              }}
                              className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#1F2547] backdrop-blur-md transition-colors pointer-events-auto shadow cursor-pointer"
                              title="Unduh foto ini"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFotoToDelete({
                                  id: foto.id,
                                  storagePath: foto.storage_path,
                                  urutan: idx + 1,
                                });
                              }}
                              className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors pointer-events-auto shadow cursor-pointer"
                              title="Hapus foto ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-white text-[11px] pointer-events-auto">
                          <button
                            onClick={() => setActivePhoto(imgUrl)}
                            className="flex items-center gap-1 hover:underline text-white font-medium"
                          >
                            <ZoomIn className="w-3.5 h-3.5" /> Perbesar
                          </button>
                          <span>{formatJam(foto.diambil_pada)} WITA</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Full-Screen Download */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-semibold">Bukti Kehadiran Resmi</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    handleDownloadPhoto(
                      activePhoto,
                      `Bukti-Foto-SIKUNJUNG-${kunjungan.nomor_urut}.jpg`
                    )
                  }
                  className="gap-1.5 text-xs bg-[#4F6AE8] text-white hover:bg-[#3D56D5] h-8 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Foto
                </Button>
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  aria-label="Tutup foto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt="Foto diperbesar"
              className="max-w-full max-h-[75vh] rounded-[16px] object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Foto (Bukan browser confirm!) */}
      <Dialog
        isOpen={fotoToDelete !== null}
        onClose={() => setFotoToDelete(null)}
        title="Hapus Bukti Foto Kehadiran?"
        description={`Apakah Anda yakin ingin menghapus Foto #${fotoToDelete?.urutan || ""} ini? File fisik di penyimpanan dan database akan dihapus permanen.`}
      >
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E6E8F5] mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFotoToDelete(null)}
            disabled={isDeletingFoto}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmDeleteFoto}
            isLoading={isDeletingFoto}
          >
            Ya, Hapus Foto
          </Button>
        </div>
      </Dialog>

      {/* Modal Edit Data */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Kunjungan"
        description="Koreksi salah ketik nama, nomor telepon, jumlah tamu, atau keperluan."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={editNama}
            onChange={(e) => setEditNama(e.target.value)}
            requiredIndicator
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1F2547]">Jenis Kelamin</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditJenisKelamin("Laki-laki")}
                className={`py-2 px-3 rounded-[10px] border text-xs font-semibold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 ${
                  editJenisKelamin === "Laki-laki"
                    ? "border-[#4F6AE8] bg-[#EEF1FF] text-[#4F6AE8]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Mars className="w-3.5 h-3.5 text-[#4F6AE8]" />
                Laki-laki
              </button>
              <button
                type="button"
                onClick={() => setEditJenisKelamin("Perempuan")}
                className={`py-2 px-3 rounded-[10px] border text-xs font-semibold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 ${
                  editJenisKelamin === "Perempuan"
                    ? "border-[#E5484D] bg-[#FFEBEB] text-[#E5484D]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Venus className="w-3.5 h-3.5 text-[#E5484D]" />
                Perempuan
              </button>
            </div>
          </div>

          <Input
            label="Nomor Telepon"
            value={editTelepon}
            onChange={(e) => setEditTelepon(e.target.value)}
            optionalIndicator
          />
          <Input
            label="Jumlah Tamu (Rombongan)"
            type="number"
            min="1"
            value={editJumlah}
            onChange={(e) => setEditJumlah(e.target.value)}
          />
          <Input
            label="Keperluan Kunjungan"
            value={editKeperluan}
            onChange={(e) => setEditKeperluan(e.target.value)}
            requiredIndicator
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E8F5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSavingEdit}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Konfirmasi Hapus (Admin Only) */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Kunjungan?"
        description="Data kunjungan dan semua bukti foto kehadiran akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteKunjungan}
            isLoading={isDeleting}
          >
            Ya, Hapus Permanen
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

