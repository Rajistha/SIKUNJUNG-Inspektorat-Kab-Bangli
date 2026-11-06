export type Role = "admin" | "petugas";
export type Status = "menunggu_foto" | "tercatat" | "tidak_diverifikasi";
export type Sumber = "qr" | "petugas";
// Ringkasan komposisi tamu untuk tampilan, mis. "Laki-laki", "Perempuan" atau "2 Laki-laki, 1 Perempuan".
export type JenisKelamin = string;

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Instansi {
  id: string;
  nama: string;
  is_active: boolean;
}

export interface Bidang {
  id: string;
  nama: string;
  urutan: number;
  is_active: boolean;
}

export interface Kunjungan {
  id: string;
  tanggal: string;
  nomor_urut: number;
  nama: string;
  jenis_kelamin?: JenisKelamin;
  no_telepon?: string;
  instansi_id?: string;
  instansi_lainnya?: string;
  bidang_id?: string;
  keperluan: string;
  jumlah_tamu: number;
  jumlah_laki?: number;
  jumlah_perempuan?: number;
  sumber: Sumber;
  status: Status;
  consent: boolean;
  dibuat_oleh?: string;
  waktu_masuk: string;
  instansi?: Instansi;
  bidang?: Bidang;
  dibuat_oleh_user?: User;
  foto_kehadiran?: FotoKehadiran[];
}

export interface FotoKehadiran {
  id: string;
  kunjungan_id: string;
  storage_path: string;
  urutan: number;
  diambil_oleh?: string | null;
  diambil_pada: string;
  url?: string;
}

export interface QrToken {
  id: string;
  token: string;
  berlaku_tanggal: string;
  aktif: boolean;
}

export interface TambahKunjunganInput {
  nama: string;
  jenis_kelamin?: JenisKelamin;
  no_telepon?: string;
  instansi_id?: string;
  instansi_lainnya?: string;
  bidang_id?: string;
  keperluan: string;
  jumlah_tamu?: number;
  jumlah_laki?: number;
  jumlah_perempuan?: number;
  consent: boolean;
  sumber: "qr" | "petugas";
}
