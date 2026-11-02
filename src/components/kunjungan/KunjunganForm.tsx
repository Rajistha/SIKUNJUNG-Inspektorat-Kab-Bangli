"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Instansi, Bidang } from "@/lib/types";
import { tambahKunjungan } from "@/lib/actions/kunjungan";
import { useRouter } from "next/navigation";
import { Mars, Venus, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";

interface KunjunganFormProps {
  instansiList: Instansi[];
  bidangList: Bidang[];
  sumber?: "qr" | "petugas";
  onSuccess?: (newKunjungan: any) => void;
  isModal?: boolean;
}

export function KunjunganForm({
  instansiList,
  bidangList,
  sumber = "qr",
  onSuccess,
  isModal = false,
}: KunjunganFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [instansiId, setInstansiId] = useState("");
  const [instansiLainnya, setInstansiLainnya] = useState("");
  const [bidangId, setBidangId] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [jumlahLakiLaki, setJumlahLakiLaki] = useState(0);
  const [jumlahPerempuan, setJumlahPerempuan] = useState(0);
  const [consent, setConsent] = useState(true);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLainnya = instansiId === "lainnya";
  const totalTamu = Math.max(0, jumlahLakiLaki) + Math.max(0, jumlahPerempuan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi.";
    }

    if (!instansiId) {
      newErrors.instansi = "Silakan pilih asal instansi.";
    } else if (isLainnya && !instansiLainnya.trim()) {
      newErrors.instansiLainnya = "Nama instansi lainnya wajib ditulis.";
    }

    if (!bidangId) {
      newErrors.bidang = "Silakan pilih bidang yang dituju.";
    }

    if (!keperluan.trim()) {
      newErrors.keperluan = "Keperluan kunjungan wajib diisi.";
    }

    if (totalTamu < 1) {
      newErrors.jumlahTamu = "Jumlah tamu minimal 1 orang. Silakan isi jumlah laki-laki atau perempuan.";
    }

    if (!consent) {
      newErrors.consent = "Anda harus menyetujui pernyataan penggunaan data.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const komposisiGender =
      jumlahLakiLaki > 0 && jumlahPerempuan === 0
        ? "Laki-laki"
        : jumlahPerempuan > 0 && jumlahLakiLaki === 0
        ? "Perempuan"
        : `${jumlahLakiLaki} Laki-laki, ${jumlahPerempuan} Perempuan`;

    try {
      const res = await tambahKunjungan({
        nama: nama.trim(),
        jenis_kelamin: komposisiGender as any,
        no_telepon: telepon.trim() || undefined,
        instansi_id: isLainnya ? undefined : instansiId,
        instansi_lainnya: isLainnya ? instansiLainnya.trim() : undefined,
        bidang_id: bidangId,
        keperluan: keperluan.trim(),
        jumlah_tamu: totalTamu,
        consent: true,
        sumber,
      });

      if (!res.success) {
        toast.error(res.error || "Gagal menyimpan data kunjungan.");
        setIsLoading(false);
        return;
      }

      toast.success("Data kunjungan berhasil dicatat!");

      if (onSuccess) {
        onSuccess(res.data);
      } else {
        // Publik redirect ke /tamu/selesai dengan query params
        const qParams = new URLSearchParams({
          nomor: String(res.data?.nomor_urut || 1),
          nama: res.data?.nama || nama,
          jam: res.data?.waktu_masuk || new Date().toISOString(),
        });
        router.push(`/tamu/selesai?${qParams.toString()}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Nama Lengkap */}
      <Input
        label="Nama Lengkap Tamu"
        requiredIndicator
        placeholder="Contoh: I Wayan Sudarsana"
        value={nama}
        onChange={(e) => {
          setNama(e.target.value);
          if (errors.nama) setErrors((prev) => ({ ...prev, nama: "" }));
        }}
        error={errors.nama}
        autoComplete="name"
      />

      {/* 2. No Telepon / WhatsApp */}
      <Input
        label="Nomor Telepon / WhatsApp"
        optionalIndicator
        type="tel"
        placeholder="Contoh: 08123456789"
        value={telepon}
        onChange={(e) => setTelepon(e.target.value)}
        helperText="Digunakan jika perlu konfirmasi lebih lanjut"
      />

      {/* 3. Asal Instansi */}
      <div className="space-y-2">
        <Select
          label="Asal Instansi"
          requiredIndicator
          value={instansiId}
          onChange={(e) => {
            setInstansiId(e.target.value);
            if (errors.instansi) setErrors((prev) => ({ ...prev, instansi: "" }));
          }}
          error={errors.instansi}
        >
          <option value="">-- Pilih Instansi / OPD / Umum --</option>
          {instansiList.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.nama}
            </option>
          ))}
          <option value="lainnya">Lainnya (Tulis Mandiri / Masyarakat Umum)</option>
        </Select>

        {isLainnya && (
          <Input
            placeholder="Tuliskan nama instansi, kantor, atau desa Anda..."
            value={instansiLainnya}
            onChange={(e) => {
              setInstansiLainnya(e.target.value);
              if (errors.instansiLainnya) setErrors((prev) => ({ ...prev, instansiLainnya: "" }));
            }}
            error={errors.instansiLainnya}
          />
        )}
      </div>

      {/* 4. Bidang Tujuan */}
      <Select
        label="Bidang / Pejabat yang Dituju"
        requiredIndicator
        value={bidangId}
        onChange={(e) => {
          setBidangId(e.target.value);
          if (errors.bidang) setErrors((prev) => ({ ...prev, bidang: "" }));
        }}
        error={errors.bidang}
      >
        <option value="">-- Pilih Bidang Tujuan --</option>
        {bidangList.map((bid) => (
          <option key={bid.id} value={bid.id}>
            {bid.nama}
          </option>
        ))}
      </Select>

      {/* 5. Keperluan Kunjungan */}
      <Input
        label="Keperluan Kunjungan"
        requiredIndicator
        placeholder="Contoh: Koordinasi pengawasan atau konsultasi tindak lanjut"
        value={keperluan}
        onChange={(e) => {
          setKeperluan(e.target.value);
          if (errors.keperluan) setErrors((prev) => ({ ...prev, keperluan: "" }));
        }}
        error={errors.keperluan}
      />

      {/* 6. Jumlah Tamu Berdasarkan Gender */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#1F2547]">
            Jumlah Tamu <span className="text-[#E5484D]">*</span>
          </label>
          <span className="text-xs text-[#8A90B0]">
            Total: <strong className="text-[#1F2547]">{totalTamu} orang</strong>
          </span>
        </div>

        <div className="space-y-2">
          {/* Laki-laki */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-[14px] border border-[#E6E8F5] bg-white hover:border-[#CCD2F0] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4F6AE8] flex items-center justify-center shrink-0">
                <Mars className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#1F2547]">Laki-laki</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F4F5FD] p-1 rounded-[12px] border border-[#E6E8F5]">
              <button
                type="button"
                onClick={() => {
                  setJumlahLakiLaki((prev) => Math.max(0, prev - 1));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                disabled={jumlahLakiLaki === 0}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] bg-white text-[#1F2547] hover:bg-gray-100 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-xs transition-all touch-manipulation select-none"
                aria-label="Kurangi laki-laki"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                type="number"
                min="0"
                max="99"
                value={jumlahLakiLaki}
                onChange={(e) => {
                  setJumlahLakiLaki(Math.max(0, parseInt(e.target.value) || 0));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                className="w-10 text-center font-bold text-base text-[#1F2547] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  setJumlahLakiLaki((prev) => Math.min(99, prev + 1));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] bg-[#4F6AE8] text-white hover:bg-[#3E57D0] active:scale-95 flex items-center justify-center cursor-pointer shadow-xs transition-all touch-manipulation select-none"
                aria-label="Tambah laki-laki"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Perempuan */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-[14px] border border-[#E6E8F5] bg-white hover:border-[#CCD2F0] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#E5484D] flex items-center justify-center shrink-0">
                <Venus className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#1F2547]">Perempuan</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F4F5FD] p-1 rounded-[12px] border border-[#E6E8F5]">
              <button
                type="button"
                onClick={() => {
                  setJumlahPerempuan((prev) => Math.max(0, prev - 1));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                disabled={jumlahPerempuan === 0}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] bg-white text-[#1F2547] hover:bg-gray-100 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-xs transition-all touch-manipulation select-none"
                aria-label="Kurangi perempuan"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                type="number"
                min="0"
                max="99"
                value={jumlahPerempuan}
                onChange={(e) => {
                  setJumlahPerempuan(Math.max(0, parseInt(e.target.value) || 0));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                className="w-10 text-center font-bold text-base text-[#1F2547] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  setJumlahPerempuan((prev) => Math.min(99, prev + 1));
                  if (errors.jumlahTamu) setErrors((prev) => ({ ...prev, jumlahTamu: "" }));
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] bg-[#E5484D] text-white hover:bg-[#D13C41] active:scale-95 flex items-center justify-center cursor-pointer shadow-xs transition-all touch-manipulation select-none"
                aria-label="Tambah perempuan"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {errors.jumlahTamu && (
          <p className="text-xs text-[#E5484D] font-medium mt-1">{errors.jumlahTamu}</p>
        )}
      </div>

      {/* 7. Pernyataan Persetujuan */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer text-sm text-[#1F2547] p-1 rounded-lg hover:bg-gray-50/80 transition-colors">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-[#E6E8F5] text-[#4F6AE8] focus:ring-[#4F6AE8] shrink-0 cursor-pointer"
          />
          <span className="text-[#8A90B0] text-xs leading-relaxed select-none">
            Saya menyatakan bahwa data ini benar dan menyetujui penggunaannya untuk keperluan administrasi kunjungan di Inspektorat Kabupaten Bangli.
          </span>
        </label>
        {errors.consent && (
          <p className="text-xs text-[#E5484D] mt-1 font-medium">{errors.consent}</p>
        )}
      </div>

      {/* 8. Tombol Kirim */}
      <div className="pt-3">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full min-h-[48px] text-base font-medium shadow-md shadow-[#4F6AE8]/20 touch-manipulation cursor-pointer"
        >
          {sumber === "petugas" ? "Simpan & Lanjut Foto" : "Kirim Data Kunjungan"}
        </Button>
      </div>
    </form>
  );
}
