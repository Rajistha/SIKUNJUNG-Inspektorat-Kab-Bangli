"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Trash2, CheckCircle2, AlertCircle, SwitchCamera, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { compressImageToDataUrl } from "@/lib/utils";

interface CameraCaptureProps {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  initialPhotos?: string[];
  disabled?: boolean;
}

export function CameraCapture({
  onPhotosChange,
  maxPhotos = 5,
  initialPhotos = [],
  disabled = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isStarting, setIsStarting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const attachStream = useCallback((mediaStream: MediaStream) => {
    streamRef.current = mediaStream;
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setCameraError(null);

    // Matikan stream sebelumnya (ref selalu berisi stream terbaru, tidak basi)
    stopStream();

    try {
      attachStream(
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      );
    } catch (err) {
      console.warn("Camera access fallback or denied:", err);
      // Fallback tanpa facingMode jika kamera yang diminta tidak didukung
      try {
        attachStream(await navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
      } catch {
        setCameraError(
          "Tidak dapat mengakses kamera. Anda tetap dapat mengunggah file foto dari galeri/penyimpanan perangkat di bawah."
        );
      }
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stopStream, attachStream]);

  useEffect(() => {
    // Menyalakan perangkat kamera (sistem eksternal) dan mematikannya saat cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return stopStream; // kamera dimatikan saat unmount / ganti kamera
  }, [startCamera, stopStream]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (photos.length >= maxPhotos) {
      toast.error(`Maksimal ${maxPhotos} foto per kunjungan.`);
      return;
    }

    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to JPEG ~ 0.82
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

    const updated = [...photos, dataUrl];
    setPhotos(updated);
    onPhotosChange(updated);
    toast.success(`Foto ke-${updated.length} berhasil diambil!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset agar file yang sama bisa dipilih lagi
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar (JPEG, PNG, WebP) yang diperbolehkan.");
      return;
    }

    if (photos.length >= maxPhotos) {
      toast.error(`Maksimal ${maxPhotos} foto per kunjungan.`);
      return;
    }

    try {
      // Foto galeri bisa berukuran beberapa MB: kompres dulu agar muat dalam batas upload.
      const dataUrl = await compressImageToDataUrl(file);
      const updated = [...photos, dataUrl];
      setPhotos(updated);
      onPhotosChange(updated);
      toast.success(`Foto ke-${updated.length} berhasil diunggah!`);
    } catch {
      toast.error("Gagal memproses gambar. Gunakan format JPEG, PNG, atau WebP.");
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onPhotosChange(updated);
    toast.success("Foto dihapus.");
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Video Viewport */}
      <div className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-[#1F2547] shadow-inner flex items-center justify-center">
        {cameraError ? (
          <div className="text-center p-6 text-white max-w-sm">
            <AlertCircle className="w-12 h-12 text-[#E5484D] mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium mb-3">{cameraError}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startCamera}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Unggah Foto
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />

            {/* Switch Camera Button (floating top right) */}
            <button
              type="button"
              onClick={toggleCamera}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
              title="Ganti Kamera Depan/Belakang"
              aria-label="Ganti Kamera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            {/* Photo Counter Pill (floating top left) */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-md">
              {photos.length} dari {maxPhotos} foto
            </div>

            {/* Shutter Button & Upload Fallback (floating bottom center) */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= maxPhotos || disabled}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center shadow backdrop-blur-md transition-all cursor-pointer"
                title="Unggah Foto dari File / Galeri"
                aria-label="Unggah Foto"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={photos.length >= maxPhotos || isStarting || disabled}
                className="w-16 h-16 rounded-full border-4 border-white bg-[#4F6AE8] text-white flex items-center justify-center shadow-lg active:scale-95 hover:bg-[#3B52C4] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Ambil Foto"
                aria-label="Ambil Foto"
              >
                <Camera className="w-7 h-7" />
              </button>

              <div className="w-10 h-10 opacity-0 pointer-events-none" />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1F2547]">
            Hasil Foto Kehadiran ({photos.length}/{maxPhotos})
          </span>
          {photos.length > 0 && (
            <span className="text-xs text-[#2FB67C] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Siap disimpan
            </span>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="p-4 rounded-[12px] border border-dashed border-[#E6E8F5] text-center text-xs text-[#8A90B0]">
            Belum ada foto yang diambil. Klik tombol kamera di atas atau gunakan tombol unggah untuk memotret kehadiran tamu.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {photos.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-[10px] overflow-hidden border border-[#E6E8F5] group bg-black shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-90 group-hover:opacity-100 hover:bg-red-700 transition-all cursor-pointer"
                  title="Hapus foto ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

