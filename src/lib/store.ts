import { Kunjungan, Instansi, Bidang, User, FotoKehadiran, Status, TambahKunjunganInput, JenisKelamin } from "./types";
import { initialInstansi, initialBidang, initialUsers, initialKunjungan } from "./mock-data";
import { getTodayWITA } from "./utils";

// In-memory store for fallback/demo mode
let globalKunjungan: Kunjungan[] = [...initialKunjungan];
let globalInstansi: Instansi[] = [...initialInstansi];
let globalBidang: Bidang[] = [...initialBidang];
let globalUsers: User[] = [...initialUsers];

export const mockStore = {
  getInstansi(activeOnly = true): Instansi[] {
    return activeOnly ? globalInstansi.filter((i) => i.is_active) : globalInstansi;
  },

  addInstansi(nama: string): Instansi {
    const item: Instansi = {
      id: `inst-${Date.now()}`,
      nama,
      is_active: true,
    };
    globalInstansi.push(item);
    return item;
  },

  updateInstansi(id: string, nama: string, is_active: boolean): boolean {
    const idx = globalInstansi.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    globalInstansi[idx] = { ...globalInstansi[idx], nama, is_active };
    return true;
  },

  getBidang(activeOnly = true): Bidang[] {
    const list = activeOnly ? globalBidang.filter((b) => b.is_active) : globalBidang;
    return [...list].sort((a, b) => a.urutan - b.urutan);
  },

  addBidang(nama: string, urutan: number): Bidang {
    const item: Bidang = {
      id: `bid-${Date.now()}`,
      nama,
      urutan,
      is_active: true,
    };
    globalBidang.push(item);
    return item;
  },

  updateBidang(id: string, nama: string, urutan: number, is_active: boolean): boolean {
    const idx = globalBidang.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    globalBidang[idx] = { ...globalBidang[idx], nama, urutan, is_active };
    return true;
  },

  getUsers(): User[] {
    return globalUsers;
  },

  addUser(email: string, nama: string, role: "admin" | "petugas"): User {
    const item: User = {
      id: `user-${Date.now()}`,
      email,
      nama,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    globalUsers.push(item);
    return item;
  },

  updateUser(id: string, updates: Partial<User>): boolean {
    const idx = globalUsers.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    globalUsers[idx] = { ...globalUsers[idx], ...updates };
    return true;
  },

  getKunjunganHariIni(): Kunjungan[] {
    const today = getTodayWITA();
    return globalKunjungan
      .filter((k) => k.tanggal === today)
      .sort((a, b) => {
        // Status 'menunggu_foto' comes first according to design.md
        if (a.status === "menunggu_foto" && b.status !== "menunggu_foto") return -1;
        if (a.status !== "menunggu_foto" && b.status === "menunggu_foto") return 1;
        return a.nomor_urut - b.nomor_urut;
      });
  },

  getKunjunganDetail(id: string): Kunjungan | null {
    const item = globalKunjungan.find((k) => k.id === id);
    return item ? { ...item } : null;
  },

  getKunjunganRekap(dari: string, sampai: string, instansiId?: string): Kunjungan[] {
    return globalKunjungan
      .filter((k) => {
        const matchDate = k.tanggal >= dari && k.tanggal <= sampai;
        const matchInstansi = !instansiId || k.instansi_id === instansiId;
        return matchDate && matchInstansi;
      })
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return a.nomor_urut - b.nomor_urut;
      });
  },

  tambahKunjungan(input: {
    nama: string;
    jenis_kelamin?: JenisKelamin;
    no_telepon?: string;
    instansi_id?: string;
    instansi_lainnya?: string;
    bidang_id?: string;
    keperluan: string;
    jumlah_tamu?: number;
    consent: boolean;
    sumber: "qr" | "petugas";
    dibuat_oleh?: string;
  }): Kunjungan {
    const today = new Date().toISOString().split("T")[0];
    const todays = globalKunjungan.filter((k) => k.tanggal === today);
    const nextNomor = todays.reduce((max, k) => Math.max(max, k.nomor_urut), 0) + 1;

    const instansi = input.instansi_id
      ? globalInstansi.find((i) => i.id === input.instansi_id)
      : undefined;
    const bidang = input.bidang_id
      ? globalBidang.find((b) => b.id === input.bidang_id)
      : undefined;

    const newKunjungan: Kunjungan = {
      id: `kunj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tanggal: today,
      nomor_urut: nextNomor,
      nama: input.nama,
      jenis_kelamin: input.jenis_kelamin || "Laki-laki",
      no_telepon: input.no_telepon,
      instansi_id: input.instansi_id,
      instansi_lainnya: input.instansi_lainnya,
      bidang_id: input.bidang_id,
      keperluan: input.keperluan || "-",
      jumlah_tamu: input.jumlah_tamu || 1,
      sumber: input.sumber,
      status: "menunggu_foto",
      consent: input.consent,
      dibuat_oleh: input.dibuat_oleh,
      waktu_masuk: new Date().toISOString(),
      instansi,
      bidang,
      foto_kehadiran: [],
    };

    globalKunjungan.unshift(newKunjungan);
    return newKunjungan;
  },

  tambahFoto(kunjunganId: string, base64Url: string, diambilOleh: string = "user-1"): FotoKehadiran | null {
    const kunjungan = globalKunjungan.find((k) => k.id === kunjunganId);
    if (!kunjungan) return null;

    if (!kunjungan.foto_kehadiran) {
      kunjungan.foto_kehadiran = [];
    }

    if (kunjungan.foto_kehadiran.length >= 5) {
      return null;
    }

    const urutan = kunjungan.foto_kehadiran.length + 1;
    const foto: FotoKehadiran = {
      id: `foto-${Date.now()}-${urutan}`,
      kunjungan_id: kunjunganId,
      storage_path: `kunjungan/${kunjunganId}/${urutan}.jpg`,
      urutan,
      diambil_oleh: diambilOleh,
      diambil_pada: new Date().toISOString(),
      url: base64Url,
    };

    kunjungan.foto_kehadiran.push(foto);
    kunjungan.status = "tercatat";
    return foto;
  },

  hapusFoto(fotoId: string, kunjunganId: string): boolean {
    const kunjungan = globalKunjungan.find((k) => k.id === kunjunganId);
    if (!kunjungan || !kunjungan.foto_kehadiran) return false;

    kunjungan.foto_kehadiran = kunjungan.foto_kehadiran.filter((f) => f.id !== fotoId);
    // Re-index urutan
    kunjungan.foto_kehadiran.forEach((f, idx) => {
      f.urutan = idx + 1;
    });

    if (kunjungan.foto_kehadiran.length === 0) {
      kunjungan.status = "menunggu_foto";
    }

    return true;
  },

  editKunjungan(id: string, updates: Partial<Kunjungan>): boolean {
    const idx = globalKunjungan.findIndex((k) => k.id === id);
    if (idx === -1) return false;

    const curr = globalKunjungan[idx];
    const instansi = updates.instansi_id
      ? globalInstansi.find((i) => i.id === updates.instansi_id)
      : curr.instansi;
    const bidang = updates.bidang_id
      ? globalBidang.find((b) => b.id === updates.bidang_id)
      : curr.bidang;

    globalKunjungan[idx] = {
      ...curr,
      ...updates,
      instansi,
      bidang,
    };
    return true;
  },

  hapusKunjungan(id: string): boolean {
    const idx = globalKunjungan.findIndex((k) => k.id === id);
    if (idx === -1) return false;
    globalKunjungan.splice(idx, 1);
    return true;
  },
};

