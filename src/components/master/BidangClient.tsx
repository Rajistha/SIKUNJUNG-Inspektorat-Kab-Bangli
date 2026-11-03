"use client";

import React, { useState } from "react";
import { Bidang } from "@/lib/types";
import { tambahBidang, updateBidang } from "@/lib/actions/master";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Edit2, Layers, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BidangClientProps {
  initialList: Bidang[];
}

export function BidangClient({ initialList }: BidangClientProps) {
  const router = useRouter();
  const [list, setList] = useState<Bidang[]>(initialList);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [urutan, setUrutan] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNama("");
    setUrutan(String(list.length + 1));
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (item: Bidang) => {
    setEditingId(item.id);
    setNama(item.nama);
    setUrutan(String(item.urutan));
    setIsActive(item.is_active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama bidang wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const urutanNum = parseInt(urutan) || 1;
      if (editingId) {
        const res = await updateBidang(editingId, nama.trim(), urutanNum, isActive);
        if (!res.success) throw new Error(res.error);
        toast.success("Bidang berhasil diperbarui!");
        setList((prev) =>
          prev.map((b) =>
            b.id === editingId
              ? { ...b, nama: nama.trim(), urutan: urutanNum, is_active: isActive }
              : b
          ).sort((a, b) => a.urutan - b.urutan)
        );
      } else {
        const res = await tambahBidang(nama.trim(), urutanNum);
        if (!res.success) throw new Error(res.error);
        toast.success("Bidang baru berhasil ditambahkan!");
        router.refresh();
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: Bidang) => {
    try {
      const res = await updateBidang(item.id, item.nama, item.urutan, !item.is_active);
      if (!res.success) throw new Error(res.error);
      toast.success(`Bidang ${!item.is_active ? "diaktifkan" : "dinonaktifkan"}!`);
      setList((prev) =>
        prev.map((b) =>
          b.id === item.id ? { ...b, is_active: !item.is_active } : b
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
            Master Data Bidang / Irban
          </h1>
          <p className="text-xs text-[#8A90B0] mt-1">
            Kelola bidang tujuan pemeriksaan (Sekretariat, Irban I s/d IV, Investigasi) di lingkungan Inspektorat Bangli.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 font-semibold w-full sm:w-auto cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Bidang
        </Button>
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] overflow-hidden shadow-sm">
        {/* Mobile View: Kartu Bidang (md:hidden) */}
        <div className="md:hidden divide-y divide-[#E6E8F5]">
          {list.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A90B0]">
              Belum ada data bidang.
            </div>
          ) : (
            list.map((item) => (
              <div key={item.id} className="p-3.5 bg-white hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#4F6AE8] bg-[#EEF1FF] px-2 py-0.5 rounded-md">
                        Urutan #{item.urutan}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" /> Nonaktif
                          </>
                        )}
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1F2547] leading-snug">
                      {item.nama}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="gap-1 h-8 text-xs shrink-0 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Tabel Lengkap (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[650px]">
          <thead>
            <tr className="bg-[#F8F9FE] border-b border-[#E6E8F5] text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
              <th className="py-3.5 px-4 w-16">Urutan</th>
              <th className="py-3.5 px-4">Nama Bidang / Inspektur Pembantu</th>
              <th className="py-3.5 px-4 w-32">Status Dropdown</th>
              <th className="py-3.5 px-4 text-right w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E8F5]">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-[#4F6AE8]">
                  #{item.urutan}
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
        title={editingId ? "Edit Bidang" : "Tambah Bidang Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Bidang / Unit Kerja"
            placeholder="Contoh: Inspektur Pembantu Wilayah V"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Nomor Urutan Tampil"
            type="number"
            min="1"
            value={urutan}
            onChange={(e) => setUrutan(e.target.value)}
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

