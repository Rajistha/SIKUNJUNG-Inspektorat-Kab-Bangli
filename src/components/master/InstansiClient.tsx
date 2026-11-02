"use client";

import React, { useState } from "react";
import { Instansi } from "@/lib/types";
import { tambahInstansi, updateInstansi } from "@/lib/actions/master";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Edit2, Search, Building2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface InstansiClientProps {
  initialList: Instansi[];
}

export function InstansiClient({ initialList }: InstansiClientProps) {
  const router = useRouter();
  const [list, setList] = useState<Instansi[]>(initialList);
  const [search, setSearch] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = list.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setNama("");
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (item: Instansi) => {
    setEditingId(item.id);
    setNama(item.nama);
    setIsActive(item.is_active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama instansi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await updateInstansi(editingId, nama.trim(), isActive);
        if (!res.success) throw new Error(res.error);
        toast.success("Instansi berhasil diperbarui!");
        setList((prev) =>
          prev.map((i) =>
            i.id === editingId ? { ...i, nama: nama.trim(), is_active: isActive } : i
          )
        );
      } else {
        const res = await tambahInstansi(nama.trim());
        if (!res.success) throw new Error(res.error);
        toast.success("Instansi baru berhasil ditambahkan!");
        router.refresh();
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: Instansi) => {
    try {
      const res = await updateInstansi(item.id, item.nama, !item.is_active);
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Instansi ${!item.is_active ? "diaktifkan" : "dinonaktifkan"}!`
      );
      setList((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: !item.is_active } : i
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F2547]">
            Master Data Asal Instansi
          </h1>
          <p className="text-xs text-[#8A90B0] mt-1">
            Kelola daftar instansi pemerintah daerah, OPD, dan kecamatan yang tampil pada dropdown form kunjungan.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 font-semibold w-full sm:w-auto cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Instansi
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#8A90B0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#F4F5FD] border border-transparent text-sm text-[#1F2547] placeholder:text-[#8A90B0] focus:bg-white focus:border-[#4F6AE8] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#8A90B0]">
          Total: {filtered.length} instansi
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] overflow-hidden shadow-sm">
        {/* Mobile Swipe Hint */}
        <div className="sm:hidden px-4 py-2 bg-[#F8F9FE] border-b border-[#E6E8F5] text-[11px] text-[#8A90B0] flex items-center justify-between">
          <span>Geser tabel untuk opsi & aksi</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#4F6AE8]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[650px]">
          <thead>
            <tr className="bg-[#F8F9FE] border-b border-[#E6E8F5] text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12">No</th>
              <th className="py-3.5 px-4">Nama Instansi / OPD</th>
              <th className="py-3.5 px-4 w-32">Status Dropdown</th>
              <th className="py-3.5 px-4 text-right w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E8F5]">
            {filtered.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3.5 px-4 text-xs font-mono text-[#8A90B0]">
                  {idx + 1}
                </td>
                <td className="py-3.5 px-4 font-medium text-[#1F2547]">
                  {item.nama}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {item.is_active ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Nonaktif
                      </>
                    )}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Dialog Add/Edit */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingId ? "Edit Instansi" : "Tambah Instansi Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Instansi / OPD"
            placeholder="Contoh: Dinas Perhubungan"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            requiredIndicator
          />

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1F2547]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#4F6AE8]"
              />
              <span>Aktifkan (Tampilkan di opsi pilihan tamu)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E8F5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

