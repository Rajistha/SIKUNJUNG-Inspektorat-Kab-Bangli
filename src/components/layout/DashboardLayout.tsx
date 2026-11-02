"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileSpreadsheet,
  Building2,
  Layers,
  UserCheck,
  QrCode,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldAlert,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User, Instansi, Bidang } from "@/lib/types";
import { logout } from "@/lib/actions/auth";
import { Dialog } from "@/components/ui/dialog";
import { KunjunganForm } from "@/components/kunjungan/KunjunganForm";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  user: User | null;
  instansiList: Instansi[];
  bidangList: Bidang[];
  children: React.ReactNode;
}

export function DashboardLayout({
  user,
  instansiList,
  bidangList,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tambahModalOpen, setTambahModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Lock body scroll on mobile drawer open & handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navItems = [
    {
      label: "Tamu Hari Ini",
      href: "/dashboard",
      icon: Users,
      exact: true,
    },
    {
      label: "Rekap & Export",
      href: "/dashboard/rekap",
      icon: FileSpreadsheet,
    },
    {
      label: "QR Resepsionis",
      href: "/dashboard/qr",
      icon: QrCode,
    },
    ...(isAdmin
      ? [
          {
            label: "Daftar Instansi",
            href: "/dashboard/instansi",
            icon: Building2,
          },
          {
            label: "Daftar Bidang",
            href: "/dashboard/bidang",
            icon: Layers,
          },
          {
            label: "Akun Petugas",
            href: "/dashboard/pengguna",
            icon: UserCheck,
          },
          {
            label: "Arsip Berkas",
            href: "/dashboard/berkas",
            icon: FolderArchive,
          },
        ]
      : []),
  ];

  const handleTamuAdded = (newKunjungan: any) => {
    setTambahModalOpen(false);
    if (newKunjungan?.id) {
      router.push(`/dashboard/foto/${newKunjungan.id}`);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5FD] flex flex-col md:flex-row text-[#1F2547]">
      {/* Mobile Top Header */}
      <header className="print:hidden md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-[#E6E8F5] sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setTambahModalOpen(true)}
            className="gap-1 px-3 h-8 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Tamu
          </Button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-[#1F2547] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Backdrop Overlay for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Sticky & Scrollable on Desktop, Slide-over Drawer on Mobile */}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-64 bg-white border-r border-[#E6E8F5] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0 shadow-2xl md:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Logo in Sidebar */}
        <div className="shrink-0 p-5 border-b border-[#E6E8F5] flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
            <Logo size="md" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[#8A90B0] hover:text-[#1F2547] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="shrink-0 p-4 pb-2">
          <Button
            onClick={() => {
              setMobileMenuOpen(false);
              setTambahModalOpen(true);
            }}
            className="w-full gap-2 shadow-sm font-semibold h-11 text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Tamu
          </Button>
        </div>

        {/* Scrollable Middle Navigation */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-1">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#EEF1FF] text-[#4F6AE8] font-semibold shadow-xs"
                      : "text-[#1F2547] hover:bg-gray-50 hover:text-[#4F6AE8]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#4F6AE8]" : "text-[#8A90B0]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Pinned User Profile & Logout */}
        <div className="shrink-0 p-4 border-t border-[#E6E8F5] bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#EEF1FF] text-[#4F6AE8] flex items-center justify-center font-bold text-sm shrink-0 border border-[#4F6AE8]/10">
              {user?.nama ? user.nama.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-semibold text-[#1F2547] truncate"
                title={user?.nama || "Petugas"}
              >
                {user?.nama || "Petugas"}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#8A90B0] capitalize">
                {isAdmin ? <ShieldAlert className="w-3 h-3 text-[#4F6AE8]" /> : null}
                {user?.role === "admin" ? "Admin" : "Petugas"}
              </span>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-600 rounded-[10px] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden flex flex-col justify-between print:p-0 print:overflow-visible print:w-full print:max-w-full print:bg-white">
        <div className="flex-1">{children}</div>

        {/* Global Dashboard Footer */}
        <footer className="mt-12 pt-4 border-t border-[#E6E8F5] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A90B0] gap-2 print:hidden">
          <span>SIKUNJUNG &bull; Buku Tamu Digital Inspektorat Daerah Kabupaten Bangli</span>
          <span>
            Website by{" "}
            <a
              href="https://www.rajistha.my.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#4F6AE8] hover:underline"
            >
              Rajistha
            </a>
          </span>
        </footer>
      </main>

      {/* Modal Tambah Tamu (Jalur Petugas) */}
      <Dialog
        isOpen={tambahModalOpen}
        onClose={() => setTambahModalOpen(false)}
        title="Tambah Tamu Baru"
        description="Isi identitas tamu. Setelah tersimpan, Anda akan langsung diarahkan untuk pengambilan foto kehadiran."
      >
        <KunjunganForm
          instansiList={instansiList}
          bidangList={bidangList}
          sumber="petugas"
          onSuccess={handleTamuAdded}
          isModal
        />
      </Dialog>
    </div>
  );
}
