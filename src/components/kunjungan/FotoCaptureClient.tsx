"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Kunjungan } from "@/lib/types";
import { CameraCapture } from "@/components/kunjungan/CameraCapture";
import { Button } from "@/components/ui/button";
import { simpanFoto } from "@/lib/actions/foto";
import { formatNomorUrut, formatJam } from "@/lib/utils";
import { ArrowLeft, Save, Building2, User, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface FotoCaptureClientProps {
  kunjungan: Kunjungan;
}

export function FotoCaptureClient({ kunjungan }: FotoCaptureClientProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    if (photos.length === 0) {
      toast.error("Harap ambil minimal 1 foto sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    try {
      // Save each photo
      for (let i = 0; i < photos.length; i++) {
        const res = await simpanFoto(kunjungan.id, photos[i], i + 1);
        if (!res.success) {
          throw new Error(res.error || `Gagal menyimpan foto ke-${i + 1}`);
        }
      }

      toast.success("Foto kehadiran berhasil disimpan! Status kunjungan kini Tercatat.");
      router.push(`/dashboard/detail/${kunjungan.id}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan foto.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-[#8A90B0] hover:text-[#1F2547] hover:bg-[#EEF1FF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#4F6AE8] bg-[#EEF1FF] px-2.5 py-0.5 rounded-full">
                {formatNomorUrut(kunjungan.nomor_urut)}
              </span>
              <h1 className="text-lg font-bold text-[#1F2547]">
                Ambil Foto Kehadiran: {kunjungan.nama}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8A90B0] mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {kunjungan.instansi?.nama || kunjungan.instansi_lainnya || "-"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatJam(kunjungan.waktu_masuk)} WITA
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            isLoading={isSaving}
            disabled={photos.length === 0}
            className="gap-1.5 shadow-sm font-semibold"
          >
            <Save className="w-4 h-4" /> Simpan Kehadiran ({photos.length})
          </Button>
        </div>
      </div>

      {/* Camera Component */}
      <div className="bg-white rounded-[20px] border border-[#E6E8F5] p-5 shadow-[0_4px_20px_rgba(79,106,232,0.06)]">
        <CameraCapture
          onPhotosChange={setPhotos}
          maxPhotos={5}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}

