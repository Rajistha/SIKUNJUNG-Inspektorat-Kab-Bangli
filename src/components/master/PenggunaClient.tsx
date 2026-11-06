"use client";

import React, { useState } from "react";
import { User, Role } from "@/lib/types";
import { tambahUser, updateUser } from "@/lib/actions/master";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Shield, CheckCircle, XCircle, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface PenggunaClientProps {
  initialUsers: User[];
}

export function PenggunaClient({ initialUsers }: PenggunaClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addNama, setAddNama] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<Role>("petugas");
  const [isAdding, setIsAdding] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("petugas");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenAdd = () => {
    setAddNama("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("petugas");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditNama(user.nama);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditNewPassword("");
    setIsEditOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNama.trim() || !addEmail.trim() || !addPassword.trim()) {
      toast.error("Semua kolom wajib diisi.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await tambahUser(addEmail.trim(), addPassword.trim(), addNama.trim(), addRole);
      if (!res.success) throw new Error(res.error);
      toast.success("Akun baru berhasil dibuat!");
      setIsAddOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "") || "Gagal membuat akun.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editNama.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsEditing(true);
    try {
      const updates: { nama: string; role: Role; is_active: boolean; password?: string } = {
        nama: editNama.trim(),
        role: editRole,
        is_active: editIsActive,
      };

      if (editNewPassword.trim()) {
        if (editNewPassword.trim().length < 6) {
          toast.error("Kata sandi baru minimal 6 karakter.");
          setIsEditing(false);
          return;
        }
        updates.password = editNewPassword.trim();
      }

      const res = await updateUser(editingUserId, updates);
      if (!res.success) throw new Error(res.error);

      toast.success("Data akun berhasil diperbarui!");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? { ...u, nama: editNama.trim(), role: editRole, is_active: editIsActive }
            : u
        )
      );
      setIsEditOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "") || "Gagal menyimpan perubahan.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await updateUser(user.id, { is_active: !user.is_active });
      if (!res.success) throw new Error(res.error);
      toast.success(`Akun ${!user.is_active ? "diaktifkan" : "dinonaktifkan"}!`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u)));
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "") || "Gagal mengubah status akun.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F2547]">Manajemen Akun Petugas & Admin</h1>
          <p className="text-xs text-[#8A90B0] mt-1">Kelola staf resepsionis atau admin IT yang berwenang mengambil foto kehadiran dan merekap data kunjungan.</p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 font-semibold w-full sm:w-auto cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Akun
        </Button>
      </div>

      {/* Users Table & Mobile Cards */}
      <div className="bg-white rounded-[16px] border border-[#E6E8F5] overflow-hidden shadow-sm">
        {/* Mobile View: Kartu Pengguna (md:hidden) */}
        <div className="md:hidden divide-y divide-[#E6E8F5]">
          {users.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A90B0]">
              Belum ada data staf/pengguna.
            </div>
          ) : (
            users.map((item, idx) => (
              <div key={item.id} className="p-3.5 bg-white hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-[#8A90B0]">#{idx + 1}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${item.role === "admin" ? "bg-[#EEF1FF] text-[#4F6AE8] font-bold" : "bg-gray-100 text-gray-700"}`}>
                        {item.role === "admin" && <Shield className="w-3 h-3" />}
                        {item.role === "admin" ? "Admin" : "Petugas"}
                      </span>
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          item.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" /> Dinonaktifkan
                          </>
                        )}
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1F2547] leading-snug">
                      {item.nama}
                    </h3>
                    <p className="font-mono text-xs text-[#8A90B0] mt-0.5 truncate">
                      {item.email}
                    </p>
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
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[#F8F9FE] border-b border-[#E6E8F5] text-xs font-semibold text-[#8A90B0] uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12">No</th>
              <th className="py-3.5 px-4">Nama Lengkap</th>
              <th className="py-3.5 px-4">Email Login</th>
              <th className="py-3.5 px-4 w-32">Hak Akses</th>
              <th className="py-3.5 px-4 w-36">Status Akun</th>
              <th className="py-3.5 px-4 text-right w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E8F5]">
            {users.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3.5 px-4 text-xs font-mono text-[#8A90B0]">{idx + 1}</td>
                <td className="py-3.5 px-4 font-semibold text-[#1F2547]">{item.nama}</td>
                <td className="py-3.5 px-4 font-mono text-xs text-[#8A90B0]">{item.email}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.role === "admin" ? "bg-[#EEF1FF] text-[#4F6AE8] font-bold" : "bg-gray-100 text-gray-700"}`}>
                    {item.role === "admin" && <Shield className="w-3 h-3" />}
                    {item.role === "admin" ? "Admin" : "Petugas"}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      item.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    {item.is_active ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Dinonaktifkan
                      </>
                    )}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="gap-1 h-8 text-xs font-medium"
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

      {/* Dialog Add User */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Buat Akun Petugas Baru"
        description="Akun ini dapat masuk ke dashboard SIKUNJUNG untuk verifikasi dan pemotretan tamu."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nama Lengkap Staf"
            placeholder="Contoh: Ni Luh Gede Resepsionis"
            value={addNama}
            onChange={(e) => setAddNama(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Email Kedinasan"
            type="email"
            placeholder="nama@banglikab.go.id"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Kata Sandi Awal"
            type="password"
            placeholder="Minimal 6 karakter"
            value={addPassword}
            onChange={(e) => setAddPassword(e.target.value)}
            requiredIndicator
          />

          <Select
            label="Peran / Hak Akses"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as Role)}
            requiredIndicator
          >
            <option value="petugas">Petugas</option>
            <option value="admin">Admin</option>
          </Select>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E8F5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isAdding}>
              Buat Akun
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog Edit User */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Akun Pengguna"
        description="Ubah nama, peran hak akses, status aktif, atau atur kata sandi baru."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Nama Lengkap Staf"
            value={editNama}
            onChange={(e) => setEditNama(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Email Login (Tidak Dapat Diubah)"
            value={editEmail}
            disabled
            helperText="Alamat email digunakan sebagai identitas akun permanen"
          />

          <Select
            label="Peran / Hak Akses"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as Role)}
            requiredIndicator
          >
            <option value="petugas">Petugas</option>
            <option value="admin">Admin</option>
          </Select>

          <Select
            label="Status Akun"
            value={editIsActive ? "true" : "false"}
            onChange={(e) => setEditIsActive(e.target.value === "true")}
            requiredIndicator
          >
            <option value="true">Aktif</option>
            <option value="false">Dinonaktifkan</option>
          </Select>

          <Input
            label="Ganti Kata Sandi Baru"
            type="password"
            placeholder="Kosongkan jika tidak ingin mengubah sandi"
            value={editNewPassword}
            onChange={(e) => setEditNewPassword(e.target.value)}
            optionalIndicator
            helperText="Isi minimal 6 karakter jika ingin mereset kata sandi staf ini"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E8F5]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isEditing}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
