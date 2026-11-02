"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { login } from "@/lib/actions/auth";
import Link from "next/link";
import toast from "react-hot-toast";
import { LogIn, Shield, User, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email, password });
      if (res && !res.success) {
        toast.error(res.error || "Gagal masuk. Periksa kembali email dan sandi.");
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      toast.error(err.message || "Terjadi kesalahan sistem.");
      setIsLoading(false);
    }
  };

  const handleDemoFill = (role: "petugas" | "admin") => {
    if (role === "petugas") {
      setEmail("petugas@banglikab.go.id");
      setPassword("petugas123");
    } else {
      setEmail("admin@banglikab.go.id");
      setPassword("inspektorat234!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D9DAFB] via-[#EEF1FF] to-[#F4F5FD] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F6AE8] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[24px] border border-[#E6E8F5] p-8 shadow-[0_12px_40px_rgba(79,106,232,0.1)]">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2547] tracking-tight">
              SIKUNJUNG
            </h1>
            <p className="text-xs text-[#8A90B0] mt-1">
              Inspektorat Daerah Kabupaten Bangli
            </p>
            <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#EEF1FF] text-[#4F6AE8] text-xs font-semibold">
              Portal Petugas & Admin
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Dinas / Akun"
              type="email"
              placeholder="nama@banglikab.go.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              requiredIndicator
              autoComplete="email"
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              requiredIndicator
              autoComplete="current-password"
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full text-base font-semibold mt-2 shadow-md shadow-[#4F6AE8]/20"
            >
              <LogIn className="w-4 h-4 mr-2" /> Masuk ke Dashboard
            </Button>
          </form>

          {/* Quick Demo Pill Selector */}
          <div className="mt-6 pt-5 border-t border-[#E6E8F5]">
            <p className="text-[11px] text-center font-medium text-[#8A90B0] mb-2.5">
              Akun Coba Cepat (Mode Demo / Pengujian):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("petugas")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#EEF1FF] text-[#4F6AE8] text-xs font-medium hover:bg-[#4F6AE8] hover:text-white transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" /> Petugas
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("admin")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-gray-100 text-[#1F2547] text-xs font-medium hover:bg-[#1F2547] hover:text-white transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" /> Admin IT
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-[#8A90B0] mt-6 space-y-2">
          <p>Tidak punya akses akun? Hubungi Admin Inspektorat Bangli.</p>
          <p className="text-[11px] pt-1 border-t border-[#E6E8F5]/80">
            Website by{" "}
            <a
              href="https://www.rajistha.my.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#4F6AE8] hover:underline"
            >
              Rajistha
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
