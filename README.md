# SIKUNJUNG - Buku Tamu Digital Inspektorat Kabupaten Bangli

Sistem Informasi Kunjungan (SIKUNJUNG) berbasis web untuk Inspektorat Daerah Pemerintah Kabupaten Bangli. Dibangun berdasarkan spesifikasi [PRD.md](PRD.md), [design.md](design.md), dan [ERD.md](ERD.md).

---

## 🌟 Fitur Utama

1. **Jalur Publik Tamu (Mobile-First via QR Code)**
   - Akses instan tanpa login via scan QR di meja resepsionis (`/tamu`).
   - Pengisian form cepat (< 30 detik): Nama lengkap, No. telepon (opsional), Pilihan asal Instansi/OPD (dengan opsi *Lainnya*), Bidang tujuan, Keperluan, dan Jumlah tamu rombongan.
   - Layar sukses dengan **Nomor Urut Kunjungan Harian besar** (contoh `#001`, `#014`) dan instruksi langsung lapor ke resepsionis untuk foto kehadiran.
   - Bebas upload file / foto di sisi tamu (mencegah manipulasi & spam).

2. **Jalur Petugas Resepsionis & Dashboard Pengawasan**
   - Banner sapaan dinamis bergaya *Hireism* dengan peringatan antrean tamu yang belum difoto.
   - 3 Kartu Ringkasan real-time: **Tamu Hari Ini**, **Menunggu Foto**, dan **Tercatat Sah**.
   - Tabel Tamu Hari Ini dengan prioritas status: tamu *Menunggu foto* otomatis berada di baris paling atas dengan latar kuning lembut.
   - Tombol **+ Tambah Tamu** langsung dari dashboard untuk tamu yang didaftarkan langsung oleh petugas.

3. **Pengambilan Foto Kehadiran Langsung Kamera (WebRTC)**
   - Hanya dapat diambil oleh Petugas yang telah login (`/dashboard/foto/[id]`).
   - Menggunakan API kamera browser (`getUserMedia`) dengan tombol ganti kamera depan/belakang (*facing mode*).
   - Mendukung hingga 5 foto per kunjungan dengan thumbnail & tombol hapus/ulang.
   - Kompresi foto otomatis di sisi klien (~200–400 KB JPEG).
   - Begitu minimal 1 foto tersimpan, status otomatis berubah menjadi **Tercatat**.

4. **Detail Kunjungan & Galeri Bukti**
   - Halaman detail lengkap (`/dashboard/detail/[id]`): menampilkan nomor telepon asli, tombol klik langsung chat WhatsApp, riwayat waktu server, dan persetujuan UU PDP.
   - Galeri foto resolusi penuh dengan mode *lightbox zoom*.
   - Fitur koreksi salah ketik data tamu (*Edit*).
   - Hak hapus permanen hanya untuk Administrator.

5. **Rekap Bulanan & Export Excel (SheetJS)**
   - Halaman rekap (`/dashboard/rekap`) dengan filter rentang tanggal, filter instansi, dan pencarian kata kunci.
   - Satu klik unduh format Excel (`.xlsx`) resmi sesuai kolom standar laporan inspektorat ke pimpinan.

6. **QR Standee Meja Resepsionis**
   - Halaman cetak QR (`/dashboard/qr`) beresolusi tinggi (800px).
   - Desain kartu akrilik standee resmi berlogo Inspektorat Bangli, siap cetak ke format kertas A4 (`Ctrl+P` / tombol Cetak).

7. **Kelola Master Data & Akun (Admin IT)**
   - Master Data Instansi (`/dashboard/instansi`): tambah, ubah nama, aktifkan/nonaktifkan OPD.
   - Master Data Bidang (`/dashboard/bidang`): kelola urutan Sekretariat, Irban I s/d IV, dan Bidang Investigasi.
   - Manajemen Akun Staf (`/dashboard/pengguna`): tambah akun petugas baru, nonaktifkan, dan reset sandi.

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Server Development

```bash
npm run dev
```

Buka peramban di: **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Akun Pengujian (Demo Mode)

Aplikasi telah dilengkapi **Dual-Mode**:
- **Mode Demo / Offline**: Berjalan langsung tanpa konfigurasi database eksternal menggunakan in-memory mock store.
- **Mode Supabase**: Aktif otomatis saat variabel kredensial di `.env.local` terisi.

Untuk mencoba login ke dashboard (`/login`), Anda dapat langsung menggunakan tombol cepat atau kredensial berikut:

| Peran | Email | Kata Sandi | Akses |
|---|---|---|---|
| **Petugas Resepsionis** | `petugas@bangli.go.id` | `petugas123` | Dashboard, ambil foto, detail, rekap Excel, cetak QR |
| **Administrator IT** | `admin@bangli.go.id` | `inspektorat234!` | Semua fitur petugas + Master Instansi, Bidang, Pengguna, dan Hapus data |

---

## 🗄️ Menghubungkan ke Supabase (Produksi)

1. Buat proyek baru di [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** di Supabase, lalu jalankan script yang telah disediakan pada file:
   [`supabase/schema.sql`](supabase/schema.sql)
3. Buat storage bucket privat dengan nama `foto-kehadiran`.
4. Salin URL dan anon key ke file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Restart server Next.js (`npm run dev` atau `npm run build && npm run start`).

---

## 📁 Struktur Direktori

```text
SIKUNJUNG/
├── design.md                  # Panduan desain UI/UX & Design Tokens
├── PRD.md                     # Product Requirement Document
├── ERD.md                     # Entity Relationship Diagram
├── supabase/
│   └── schema.sql             # SQL Migration lengkap (Tabel, RLS, Trigger, Seed)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout dengan Font Rubik & Toaster
│   │   ├── globals.css        # Tailwind v4 theme & token warna
│   │   ├── page.tsx           # Halaman pemilih portal (Tamu / Petugas)
│   │   ├── login/             # Halaman login petugas/admin
│   │   ├── tamu/
│   │   │   ├── page.tsx       # Form publik tamu via QR
│   │   │   └── selesai/       # Layar sukses nomor urut (#014)
│   │   └── dashboard/
│   │       ├── page.tsx       # Dashboard tamu hari ini
│   │       ├── layout.tsx     # Shell dashboard (Sidebar 240px + Topbar)
│   │       ├── foto/[id]/     # Kamera pemotretan kehadiran (WebRTC)
│   │       ├── detail/[id]/   # Detail kunjungan, WhatsApp, & lightbox
│   │       ├── rekap/         # Filter tanggal & Export Excel
│   │       ├── qr/            # Tampilan & cetak QR akrilik meja
│   │       ├── instansi/      # Master data OPD / Instansi
│   │       ├── bidang/        # Master data Bidang / Irban
│   │       └── pengguna/      # Manajemen akun staf
│   ├── components/
│   │   ├── ui/                # Tombol, Input, Select, Badge, Card, Dialog
│   │   ├── layout/            # Sidebar responsive & Header
│   │   ├── kunjungan/         # KunjunganForm, CameraCapture, Detail
│   │   ├── rekap/             # RekapClient & export SheetJS
│   │   ├── qr/                # QrDisplayClient generator
│   │   └── master/            # InstansiClient, BidangClient, PenggunaClient
│   └── lib/
│       ├── types.ts           # TypeScript interfaces & enums
│       ├── utils.ts           # Helper tanggal ID, format nomor urut, kompresi
│       ├── store.ts           # In-memory data store fallback
│       ├── mock-data.ts       # Data awal instansi, bidang, & kunjungan Bangli
│       ├── supabase/          # Supabase client, server, & middleware
│       └── actions/           # Server actions (auth, kunjungan, foto, master)
└── package.json
```
