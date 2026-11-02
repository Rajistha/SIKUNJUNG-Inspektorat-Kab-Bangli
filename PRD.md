# PRD: SIKUNJUNG Inspektorat Kabupaten Bangli

SIKUNJUNG = Sistem Informasi Kunjungan. Buku tamu digital Inspektorat Kabupaten Bangli.

Versi 1.0 · November 2026 · Status: Draf untuk ditinjau

## 1. Ringkasan

Aplikasi web buku tamu untuk Inspektorat Kabupaten Bangli. Tamu dapat mengisi data kunjungan sendiri lewat QR di resepsionis, atau diisikan oleh petugas. **Foto kehadiran hanya boleh diambil oleh petugas**, boleh lebih dari satu foto per kunjungan. Petugas memantau dan merekap seluruh kunjungan dari satu halaman.

## 2. Latar belakang dan tujuan

Buku tamu kertas sulit direkap, mudah hilang, dan tidak punya bukti kehadiran yang rapi. Tujuan aplikasi:

- Mencatat kunjungan secara digital, rapi, dan seragam.
- Menyimpan bukti kehadiran berupa foto yang diambil petugas.
- Memudahkan rekap bulanan untuk laporan ke pimpinan.
- Cukup sederhana sehingga tamu dan petugas langsung paham tanpa pelatihan.

**Bukan tujuan di versi 1:** check-out, notifikasi WhatsApp, tanda tangan digital, survei kepuasan, nomor antrian, dan role bertingkat. Semua ditunda sampai alur dasar berjalan lancar.

## 3. Pengguna

| Peran | Siapa | Akses | Kebutuhan utama |
|---|---|---|---|
| Tamu | Pengunjung dari instansi lain atau masyarakat | Halaman form via QR, tanpa login | Mengisi data dengan cepat (kurang dari 30 detik) |
| Petugas | Staf resepsionis atau Sekretariat | Login, halaman admin | Melihat tamu, mengisi data, mengambil foto, rekap |
| Admin | Pengelola sistem (staf IT atau Sekretariat) | Login, semua fitur petugas plus kelola akun dan master data | Mengelola daftar instansi, bidang, dan akun petugas |

## 4. Alur utama

### Jalur 1: Tamu scan QR

1. Tamu scan QR di meja resepsionis dengan HP sendiri.
2. Tamu mengisi nama, no. telepon (opsional), asal instansi, dan tujuan bidang, lalu menekan **Kirim**.
3. Layar selesai menampilkan nomor urut (contoh #014) dan pesan: "Silakan lapor ke petugas untuk foto kehadiran."
4. Data masuk dengan status **Menunggu foto**.
5. Petugas memanggil tamu, mengambil foto, status berubah menjadi **Tercatat**.

### Jalur 2: Petugas mengisikan

1. Petugas login lalu menekan **+ Tambah Tamu**.
2. Petugas mengisi form yang sama, lalu langsung lanjut ke pengambilan foto.
3. Setelah minimal 1 foto tersimpan, status menjadi **Tercatat**.

> Aturan kunci: tamu jalur QR dianggap **belum sah hadir** sampai petugas mengambil foto.

## 5. Kebutuhan fungsional

### Halaman tamu (publik, via QR)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | Form berisi: nama (wajib), no. telepon (opsional), instansi (dropdown plus "Lainnya"), bidang tujuan (dropdown), keperluan (opsional) | Wajib |
| F-02 | Pernyataan persetujuan singkat: "Data Anda digunakan untuk keperluan administrasi kunjungan" | Wajib |
| F-03 | Layar sukses dengan nomor urut harian dan instruksi lapor ke petugas | Wajib |
| F-04 | Tidak ada fitur foto atau unggah file sama sekali di halaman tamu | Wajib |
| F-05 | Pembatasan jumlah kiriman per perangkat (anti-spam) | Wajib |
| F-06 | Waktu kunjungan dicatat otomatis oleh server | Wajib |
| F-07 | Kolom jumlah tamu untuk rombongan (default 1) | Disarankan |

### Halaman petugas (login)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-10 | Login email dan password | Wajib |
| F-11 | Daftar tamu hari ini: jam, nama, instansi, tujuan, status, aksi. Status *Menunggu foto* tampil paling atas | Wajib |
| F-12 | Penghitung "Menunggu foto" hari ini sebagai pengingat | Wajib |
| F-13 | Tombol **+ Tambah Tamu** dengan form yang sama seperti tamu | Wajib |
| F-14 | Ambil foto langsung dari kamera perangkat petugas, bukan unggah dari galeri | Wajib |
| F-15 | Bisa mengambil beberapa foto per kunjungan, maksimal 5 | Wajib |
| F-16 | Hapus atau ulangi foto sebelum disimpan | Wajib |
| F-17 | Kompres foto otomatis di sisi klien (target 200 sampai 400 KB) | Wajib |
| F-18 | Filter tanggal, filter instansi, dan pencarian nama | Wajib |
| F-19 | Detail kunjungan dengan galeri foto ukuran besar | Wajib |
| F-20 | Export rekap ke Excel berdasarkan rentang tanggal | Wajib |
| F-21 | Edit data kunjungan (koreksi salah ketik) | Disarankan |
| F-22 | Tampilkan QR resmi untuk dicetak atau ditampilkan di layar | Disarankan |

### Halaman admin

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-30 | Kelola daftar instansi (tambah, ubah, nonaktifkan) | Wajib |
| F-31 | Kelola daftar bidang (Sekretariat, Irban I sampai IV, dan seterusnya) | Wajib |
| F-32 | Kelola akun petugas (tambah, nonaktifkan, reset password) | Wajib |
| F-33 | Rekap statistik sederhana: tamu per hari, per bulan, instansi terbanyak | Opsional |

## 6. Aturan bisnis

- Nomor urut dimulai dari 1 setiap hari dan unik per tanggal.
- Foto hanya bisa dibuat oleh pengguna yang login sebagai petugas atau admin.
- Maksimal 5 foto per kunjungan.
- Kunjungan dari QR yang tidak difoto dalam 24 jam ditandai **Tidak diverifikasi** (tidak dihapus).
- Nomor telepon ditampilkan sebagian (081xxxx789) di tabel, lengkap hanya di halaman detail.
- Kunjungan tidak dihapus permanen oleh petugas. Hanya admin yang boleh menghapus.
- Foto disimpan di storage privat, diakses lewat URL bertanda tangan yang kedaluwarsa.

## 7. Kebutuhan non-fungsional

- **Kinerja:** form tamu terbuka kurang dari 3 detik di jaringan seluler biasa.
- **Perangkat:** nyaman di HP (tamu) dan tablet atau laptop (petugas).
- **Keamanan:** HTTPS wajib, password di-hash, rate limit pada endpoint publik, akses foto dibatasi.
- **Privasi:** sesuai UU Pelindungan Data Pribadi. Ada pernyataan penggunaan data, akses dibatasi, dan kebijakan retensi foto (usulan: 12 bulan).
- **Ketersediaan dan backup:** backup database harian.
- **Bahasa:** Indonesia sederhana, tulisan besar dan jelas.

## 8. Tech stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js (React) |
| Tampilan | Tailwind CSS dan shadcn/ui |
| Database, login, storage | Supabase (PostgreSQL) |
| Akses data | Supabase client atau Prisma |
| Export Excel | SheetJS |
| Kamera | Browser API getUserMedia |
| Alternatif | Laravel dan Filament bila pengelola terbiasa PHP |

## 9. Metrik keberhasilan

- Tamu menyelesaikan form dalam kurang dari 30 detik.
- Lebih dari 95 persen kunjungan berstatus Tercatat (ada foto) di hari yang sama.
- Rekap bulanan dapat diekspor dalam kurang dari 1 menit.
- Petugas baru dapat memakai aplikasi tanpa pelatihan lebih dari 10 menit.

## 10. Tahapan rilis

| Tahap | Isi |
|---|---|
| MVP | Form QR, login petugas, daftar tamu, ambil foto banyak, detail, filter, export Excel |
| Tahap 2 | Master data instansi dan bidang, kelola akun, edit data, QR berganti harian, tanda *Tidak diverifikasi* |
| Tahap 3 | Statistik, laporan PDF, check-out, notifikasi WhatsApp atau Telegram |

## 11. Risiko

| Risiko | Penanganan |
|---|---|
| Form QR dipakai dari luar kantor | Rate limit, opsi token QR berganti harian |
| Penyimpanan foto cepat penuh | Kompres foto, batas 5 foto, retensi otomatis |
| Tamu lupa lapor ke petugas | Nomor urut besar di layar sukses, petugas mengarahkan di meja |
| Data pribadi bocor | Storage privat, URL bertanda tangan, akses dibatasi |

## 12. Pertanyaan terbuka

1. Apakah tamu sering datang berombongan? Jika ya, kolom jumlah tamu (F-07) dijadikan wajib tampil.
2. Server di mana data akan disimpan (Diskominfo Bangli atau layanan cloud)?
3. Berapa lama foto harus disimpan?
4. Siapa yang akan menjadi admin dan merawat sistem?
