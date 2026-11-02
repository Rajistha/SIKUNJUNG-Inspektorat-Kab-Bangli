# SIKUNJUNG

### Sistem Informasi Kunjungan Tamu Digital

**Inspektorat Daerah Pemerintah Kabupaten Bangli**

---

## Ringkasan Sistem

**SIKUNJUNG** (Sistem Informasi Kunjungan) adalah platform buku tamu digital resmi yang dirancang khusus untuk memenuhi standar tata kelola pengawasan, akuntabilitas, dan transparansi di lingkungan **Inspektorat Daerah Kabupaten Bangli**.

Sistem ini menggantikan pencatatan buku tamu konvensional berbasis kertas menjadi sistem digital terintegrasi yang dilengkapi dengan pencatatan nomor antrean harian otomatis, verifikasi kehadiran fisik berbasis foto instan, pelaporan rekapitulasi eksekutif berstandar kedinasan, serta integrasi kode QR meja resepsionis.

---

## Fitur Utama & Modul Sistem

### 1. Pelayanan Mandiri Tamu (Mobile QR Check-In)

- **Akses Cepat & Efisien**: Tamu cukup memindai kode QR yang tersedia di meja resepsionis tanpa perlu memasang aplikasi tambahan (_zero-install_).
- **Formulir Terstandar**: Pengisian data cepat (< 30 detik) mencakup nama lengkap, nomor kontak, asal instansi/OPD (termasuk opsi mandiri untuk masyarakat umum), bidang/pejabat yang dituju, keperluan kunjungan, serta komposisi jumlah tamu.
- **Nomor Antrean Harian Otomatis**: Setelah pengisian formulir, tamu menerima nomor antrean harian (misal: `#001`, `#002`) yang tereset otomatis setiap pergantian hari pukul 00:00 WITA.
- **Kepatuhan Privasi Data**: Dilengkapi pernyataan persetujuan penggunaan data sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP).

### 2. Meja Kerja & Verifikasi Petugas

- **Dashboard Operasional Harian**: Memantau seluruh arus tamu secara _real-time_ dengan kategorisasi status yang jelas (_Tercatat Sah_ dan _Menunggu Foto_).
- **Pengambilan Bukti Foto Fisik (WebRTC)**: Resepsionis atau petugas yang berwenang mengambil foto kehadiran fisik tamu langsung melalui kamera perangkat untuk mencegah manipulasi dan memastikan keabsahan kunjungan.
- **Komunikasi Terintegrasi**: Tersedia tautan langsung untuk menghubungi nomor tamu via WhatsApp dalam satu klik jika diperlukan koordinasi tindak lanjut.

### 3. Arsip Berkas Digital (Cloud Storage Explorer)

- **Struktur Berbasis Folder Tamu**: Berkas bukti foto kehadiran tersimpan secara rapi dan dikelompokkan ke dalam folder masing-masing tamu berdasarkan nama, instansi, dan tanggal kunjungan.
- **Pratinjau & Unduh Cepat**: Dilengkapi fitur _lightbox zoom_ resolusi tinggi, opsi unduh foto satuan, serta unduh seluruh foto tamu sekaligus (_batch download_).
- **Pemantauan Kapasitas Real-time**: Indikator visual pemakaian kapasitas penyimpanan (_storage quota tracking_) dengan perhitungan sisa ruang secara akurat.

### 4. Pelaporan Eksekutif & Rekapitulasi Terpadu

- **Filter Multi-Kriteria**: Penyaringan riwayat kunjungan lintas rentang tanggal (harian, mingguan, bulanan, maupun periode kustom), OPD instansi asal, bidang tujuan, dan status kehadiran.
- **Ekspor Dokumen Excel (.xlsx) Resmi**: Dilengkapi format resmi kedinasan, kop instansi Pemerintah Kabupaten Bangli, stempel waktu unduh, lebar kolom proporsional, serta baris total kalkulasi.
- **Ekspor Laporan PDF (.pdf) Formal**: Berformat _A4 Landscape_ dengan kop surat resmi Inspektorat Daerah Kabupaten Bangli, tabel terstruktur, penomoran halaman otomatis, dan kolom tanda tangan pengesahan pejabat pengelola.

### 5. Media Standee Meja Resepsionis

- **Desain Siap Cetak (A4 Acrylic Insert)**: Tata letak resmi dan elegan berlogo kedinasan, dilengkapi kode QR vektor beresolusi tinggi (300 DPI) untuk dipasang pada akrilik meja tamu resepsionis kantor Inspektorat.
- **Fitur Ekspor PNG**: Memungkinkan pengunduhan desain standee dalam format gambar utuh untuk keperluan pencetakan digital.

### 6. Keamanan & Tata Kelola Pengguna

- **Hak Akses Berjenjang (RBAC)**:
  - **Petugas**: Pengawasan antrean harian, pencatatan tamu langsung, pemotretan kehadiran, dan rekapitulasi data.
  - **Admin**: Seluruh kewenangan petugas ditambah pengelolaan master data instansi, pembagian bidang kerja, manajemen akun staf, dan audit berkas.
- **Penyimpanan Terisolasi**: File bukti foto disimpan dalam wadah privat (_private storage bucket_) dengan token URL bertanda tangan temporer untuk mencegah akses tidak sah dari pihak luar.

---

## Arsitektur & Teknologi

| Komponen                        | Spesifikasi / Teknologi                           |
| ------------------------------- | ------------------------------------------------- |
| **Kerangka Kerja (Framework)**  | Next.js (App Router, Server Actions, & Turbopack) |
| **Bahasa Pemrograman**          | TypeScript                                        |
| **Tata Letak & Gaya (Styling)** | Tailwind CSS                                      |
| **Basis Data & Autentikasi**    | PostgreSQL & Supabase Engine                      |
| **Penyimpanan Cloud**           | Supabase Storage (Private Encrypted Bucket)       |
| **Mesin Pembuat PDF**           | jsPDF & jsPDF-AutoTable                           |
| **Mesin Pembuat Lembar Kerja**  | SheetJS (XLSX Engine)                             |
| **Kamera & Pemindaian**         | WebRTC Media Capture & QR Engine                  |
| **Zona Waktu Sistem**           | WITA (Waktu Indonesia Tengah / UTC+8)             |

---

## Kepemilikan & Hak Cipta

Aplikasi ini dikembangkan untuk:
**Inspektorat Daerah Pemerintah Kabupaten Bangli**  
Jl. Brigjen Ngurah Rai No. 30, Bangli, Bali 80613

_Mewujudkan Pelayanan Publik yang Transparan, Akuntabel, dan Berintegritas._
