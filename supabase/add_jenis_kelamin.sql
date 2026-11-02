-- ==============================================================================
-- Migrasi: Penambahan Kolom jenis_kelamin pada Tabel kunjungan
-- ==============================================================================

-- 1. Tambah kolom jenis_kelamin jika belum ada
ALTER TABLE public.kunjungan 
ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT DEFAULT 'Laki-laki';

-- 2. Pastikan nilai default untuk data lama
UPDATE public.kunjungan 
SET jenis_kelamin = 'Laki-laki' 
WHERE jenis_kelamin IS NULL;

