# design.md: SIKUNJUNG Inspektorat Kabupaten Bangli

Panduan desain untuk halaman tamu (QR) dan halaman petugas/admin.
Referensi gaya: dashboard "Hireism" (sidebar kiri, kartu putih bersudut membulat, aksen biru-ungu, latar lembut).

---

## 1. Prinsip desain

1. **Sederhana dulu.** Tamu selesai dalam kurang dari 30 detik. Petugas bekerja dari satu halaman utama.
2. **Satu layar, satu tugas.** Jangan menumpuk banyak aksi dalam satu tampilan.
3. **Besar dan jelas.** Tombol dan huruf besar, nyaman untuk lansia dan layar HP kecil.
4. **Status selalu terlihat.** Warna dan label status (Menunggu foto, Tercatat) harus langsung terbaca.
5. **Bahasa Indonesia sederhana.** Hindari istilah teknis.

---

## 2. Design tokens

### Warna

| Token | Nilai | Pemakaian |
|---|---|---|
| `--primary` | `#4F6AE8` | Tombol utama, menu aktif, banner, baris terpilih |
| `--primary-dark` | `#3B52C4` | Hover/active tombol utama |
| `--primary-soft` | `#EEF1FF` | Latar menu aktif, chip, highlight lembut |
| `--bg-app` | `#F4F5FD` | Latar area konten |
| `--bg-page` | `#D9DAFB` | Latar luar (opsional, halaman login) |
| `--surface` | `#FFFFFF` | Kartu, tabel, sidebar |
| `--text` | `#1F2547` | Teks utama |
| `--text-muted` | `#8A90B0` | Teks sekunder, label, placeholder |
| `--border` | `#E6E8F5` | Garis tipis kartu dan tabel |
| `--success` | `#2FB67C` | Status Tercatat |
| `--warning` | `#F5A524` | Status Menunggu foto |
| `--danger` | `#E5484D` | Error, hapus, Tidak diverifikasi |

Rasio kontras teks terhadap latar minimal 4.5:1.

### Tipografi

- Font: **Rubik** (cadangan: Inter, system-ui, sans-serif)
- Judul halaman: 24 px / semibold
- Judul kartu: 18 px / semibold
- Teks isi: 16 px / regular (minimum 16 px di halaman tamu agar tidak ter-zoom otomatis di iOS)
- Label dan keterangan: 14 px / regular
- Tombol: 16 sampai 18 px / medium

### Bentuk dan jarak

- Radius kartu: 16 px. Radius tombol dan input: 12 px. Radius chip/badge: 999 px.
- Bayangan kartu: `0 4px 16px rgba(79, 106, 232, 0.08)`
- Skala jarak: 4, 8, 12, 16, 24, 32 px
- Tinggi minimal tombol dan input: 48 px (area sentuh nyaman)

### Ikon

Lucide (garis tipis, 20 sampai 24 px). Tidak memakai emoji di antarmuka produksi.

---

## 3. Komponen

### Tombol
- **Utama:** latar `--primary`, teks putih, penuh lebar di HP.
- **Sekunder:** latar putih, garis `--border`, teks `--primary`.
- **Bahaya:** latar `--danger`, dipakai hanya untuk hapus dan selalu dengan konfirmasi.
- Status nonaktif: opasitas 50 persen, kursor tidak boleh diklik.

### Input
- Label di atas input (tidak memakai placeholder sebagai label).
- Tanda **Wajib** atau **(opsional)** di samping label.
- Pesan error berwarna `--danger` di bawah input, bahasa jelas ("Nama wajib diisi").

### Badge status

| Status | Warna | Label |
|---|---|---|
| `menunggu_foto` | `--warning` latar lembut, teks gelap | Menunggu foto |
| `tercatat` | `--success` latar lembut | Tercatat |
| `tidak_diverifikasi` | `--danger` latar lembut | Tidak diverifikasi |

Badge memakai titik berwarna plus teks, jangan hanya warna.

### Kartu ringkasan
Kartu putih dengan ikon dalam kotak berwarna lembut, angka besar, dan label kecil. Dipakai untuk: **Tamu hari ini**, **Menunggu foto**, **Tercatat**.

### Tabel
- Header abu lembut, baris 56 px, garis tipis pemisah.
- Baris *Menunggu foto* diberi latar kuning sangat lembut dan selalu paling atas.
- Baris terpilih memakai latar `--primary` dengan teks putih (seperti referensi).
- Di HP, tabel berubah menjadi daftar kartu.

### Modal dan toast
- Konfirmasi hapus: modal kecil dengan dua tombol jelas ("Batal", "Hapus").
- Toast sukses/gagal muncul di kanan atas selama 3 detik.

---

## 4. Halaman tamu (via QR, mobile-first)

Lebar maksimum 480 px, di tengah layar, latar `--bg-app`.

### Layar 1: Form
- Header: logo Inspektorat Kabupaten Bangli dan judul **SIKUNJUNG**, dengan teks kecil "Buku Tamu Digital".
- Teks pengantar: "Silakan isi data kunjungan Anda."
- Field berurutan:
  1. Nama lengkap (wajib)
  2. No. telepon (opsional)
  3. Asal instansi (pilihan, ada "Lainnya", bila dipilih muncul kolom isian)
  4. Tujuan bidang (pilihan)
  5. Keperluan (opsional, satu baris)
  6. Jumlah tamu (angka, default 1) *(tampil bila rombongan diaktifkan)*
- Teks persetujuan kecil di atas tombol: "Data Anda digunakan untuk keperluan administrasi kunjungan."
- Tombol utama penuh lebar: **Kirim**.
- **Tidak ada fitur foto atau unggah file.**

### Layar 2: Selesai
- Ikon centang hijau besar.
- Judul: "Terima kasih, [Nama]".
- **Nomor urut** sangat besar, contoh `#014`.
- Teks: "Silakan lapor ke petugas untuk foto kehadiran."
- Jam kunjungan ditampilkan kecil di bawah.
- Tombol sekunder: **Isi untuk tamu lain** (mengosongkan form).

### Kondisi khusus
- Gagal kirim: pesan jelas dan data form tidak hilang.
- Terlalu banyak kiriman (rate limit): "Terlalu banyak percobaan. Silakan lapor ke petugas."
- QR kedaluwarsa (bila token harian aktif): "Kode ini sudah tidak berlaku. Silakan scan QR terbaru di resepsionis."

---

## 5. Halaman petugas dan admin (desktop dan tablet)

### Kerangka (mengikuti referensi)
- **Sidebar kiri** (lebar 240 px, putih): logo dan nama aplikasi di atas, menu di tengah, **Keluar** di bawah.
- **Area konten** (latar `--bg-app`): bilah atas berisi kotak pencarian dan tombol **+ Tambah Tamu**.
- **Panel kanan** (opsional, hanya layar lebar): profil petugas, ringkasan hari ini.
- Di tablet/HP, sidebar menjadi menu hamburger atau bilah bawah.

### Menu sidebar

| Menu | Untuk | Keterangan |
|---|---|---|
| Dashboard / Tamu Hari Ini | Petugas, Admin | Halaman utama setelah login |
| Rekap | Petugas, Admin | Filter rentang tanggal dan Export Excel |
| Instansi | Admin | Kelola daftar instansi |
| Bidang | Admin | Kelola daftar bidang |
| Pengguna | Admin | Kelola akun petugas |
| QR Resepsionis | Petugas, Admin | Tampilkan dan cetak QR |

### Halaman utama: Tamu Hari Ini

Urutan dari atas ke bawah:

1. **Banner sapaan** berlatar `--primary` (seperti referensi): "Selamat pagi, [Nama]. Ada **3 tamu** menunggu foto." dengan tombol putih **Lihat**.
2. **Tiga kartu ringkasan:** Tamu hari ini, Menunggu foto, Tercatat.
3. **Tabel Daftar Tamu**

| Kolom | Isi |
|---|---|
| No. | Nomor urut harian |
| Jam | Waktu masuk |
| Nama | Nama tamu (plus jumlah bila rombongan) |
| Instansi | Asal instansi |
| Tujuan | Bidang |
| Status | Badge status |
| Aksi | **Ambil Foto** (jika menunggu) atau **Lihat** (jika tercatat) |

4. Di atas tabel: filter tanggal, filter instansi, kotak cari nama, dan tombol **Export Excel**.

### Layar Ambil Foto
- Pratinjau kamera besar di tengah, di sisi kiri nama dan instansi tamu.
- Tombol bulat besar **Ambil Foto**.
- Setelah dipotret: foto masuk ke baris miniatur di bawah (maksimal 5), tiap miniatur punya tombol **Hapus**.
- Penghitung: "2 dari 5 foto".
- Tombol utama **Simpan** aktif setelah minimal 1 foto. Tombol sekunder **Batal**.
- Tidak ada tombol unggah dari galeri.
- Tombol ganti kamera depan/belakang untuk perangkat yang punya dua kamera.

### Layar Detail Kunjungan
- Kiri: data lengkap (nomor telepon tampil penuh, persetujuan, sumber QR/petugas, dibuat oleh siapa).
- Kanan: galeri foto, klik untuk memperbesar.
- Aksi: **Edit**, **Tambah Foto** (selama belum melewati batas 5), **Hapus** (hanya Admin).

### Layar Rekap dan Export
- Pilih rentang tanggal, lalu **Export Excel**.
- Kolom Excel: No, Tanggal, Jam, Nama, No. Telepon, Instansi, Bidang, Keperluan, Jumlah Tamu, Status, Jumlah Foto.

### Layar Login
- Kartu putih di tengah, latar `--bg-page`, logo di atas.
- Email, password, tombol **Masuk**. Tidak ada pendaftaran mandiri.

---

## 6. Responsif

| Lebar | Perilaku |
|---|---|
| Kurang dari 640 px (HP) | Satu kolom, tombol penuh lebar, tabel jadi kartu, sidebar jadi menu hamburger |
| 640 sampai 1024 px (tablet) | Sidebar bisa dilipat, tabel dengan kolom ringkas |
| Lebih dari 1024 px (desktop) | Sidebar tetap, panel kanan tampil |

---

## 7. Aksesibilitas

- Semua tombol dan input bisa dioperasikan dengan keyboard dan memiliki fokus yang terlihat (cincin 2 px `--primary`).
- Label teks selalu menyertai warna status.
- Teks alternatif pada gambar dan ikon yang bermakna.
- Ukuran huruf mengikuti pengaturan perangkat.
- Pesan error dijelaskan dalam kalimat, bukan hanya garis merah.

---

## 8. Mikrocopy (teks antarmuka)

| Konteks | Teks |
|---|---|
| Judul halaman tamu | SIKUNJUNG, Buku Tamu Digital Inspektorat Kabupaten Bangli |
| Tombol kirim | Kirim |
| Persetujuan | Data Anda digunakan untuk keperluan administrasi kunjungan. |
| Sukses tamu | Terima kasih. Silakan lapor ke petugas untuk foto kehadiran. |
| Menunggu foto | Menunggu foto |
| Foto tersimpan | Foto kehadiran tersimpan. |
| Batas foto | Maksimal 5 foto per kunjungan. |
| Kosong | Belum ada tamu hari ini. |
| Hapus | Hapus data tamu ini? Tindakan ini tidak dapat dibatalkan. |

---

## 9. Stack tampilan

- Next.js (App Router), Tailwind CSS, shadcn/ui, ikon Lucide
- Font Rubik lewat `next/font`
- Token warna dan radius didefinisikan di `tailwind.config` atau variabel CSS agar konsisten

```css
:root {
  --primary: #4F6AE8;
  --primary-dark: #3B52C4;
  --primary-soft: #EEF1FF;
  --bg-app: #F4F5FD;
  --surface: #FFFFFF;
  --text: #1F2547;
  --text-muted: #8A90B0;
  --border: #E6E8F5;
  --success: #2FB67C;
  --warning: #F5A524;
  --danger: #E5484D;
  --radius-card: 16px;
  --radius-control: 12px;
}
```

---

## 10. Hal yang sengaja tidak dipakai di versi 1

Check-out, tanda tangan digital, survei kepuasan, nomor antrian, notifikasi WhatsApp, mode gelap, dan role bertingkat. Semua bisa ditambahkan setelah alur dasar berjalan stabil.
