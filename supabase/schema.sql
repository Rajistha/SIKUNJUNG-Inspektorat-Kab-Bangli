-- ==============================================================================
-- SIKUNJUNG: Database Schema & Migration Lengkap (PostgreSQL / Supabase)
-- Versi 1.0 - Inspektorat Daerah Kabupaten Bangli
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enum Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'petugas');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE kunjungan_status AS ENUM ('menunggu_foto', 'tercatat', 'tidak_diverifikasi');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE kunjungan_sumber AS ENUM ('qr', 'petugas');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Table: users (Profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'petugas',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table: instansi
CREATE TABLE IF NOT EXISTS public.instansi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Table: bidang
CREATE TABLE IF NOT EXISTS public.bidang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT UNIQUE NOT NULL,
    urutan INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Table: kunjungan
CREATE TABLE IF NOT EXISTS public.kunjungan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nomor_urut INT NOT NULL,
    nama TEXT NOT NULL,
    no_telepon TEXT,
    instansi_id UUID REFERENCES public.instansi(id) ON DELETE SET NULL,
    instansi_lainnya TEXT,
    bidang_id UUID REFERENCES public.bidang(id) ON DELETE SET NULL,
    keperluan TEXT,
    jenis_kelamin TEXT DEFAULT 'Laki-laki',
    jumlah_tamu INT NOT NULL DEFAULT 1,
    sumber kunjungan_sumber NOT NULL DEFAULT 'qr',
    status kunjungan_status NOT NULL DEFAULT 'menunggu_foto',
    consent BOOLEAN NOT NULL DEFAULT true,
    dibuat_oleh UUID REFERENCES public.users(id) ON DELETE SET NULL,
    waktu_masuk TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unq_kunjungan_tanggal_nomor UNIQUE (tanggal, nomor_urut)
);

-- 7. Table: foto_kehadiran
CREATE TABLE IF NOT EXISTS public.foto_kehadiran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kunjungan_id UUID NOT NULL REFERENCES public.kunjungan(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    urutan INT NOT NULL CHECK (urutan BETWEEN 1 AND 5),
    diambil_oleh UUID REFERENCES public.users(id) ON DELETE SET NULL,
    diambil_pada TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unq_foto_kunjungan_urutan UNIQUE (kunjungan_id, urutan)
);

-- 8. Table: qr_token
CREATE TABLE IF NOT EXISTS public.qr_token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    berlaku_tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_kunjungan_tanggal ON public.kunjungan (tanggal);
CREATE INDEX IF NOT EXISTS idx_kunjungan_status ON public.kunjungan (status);
CREATE INDEX IF NOT EXISTS idx_kunjungan_instansi ON public.kunjungan (instansi_id);
CREATE INDEX IF NOT EXISTS idx_foto_kunjungan_id ON public.foto_kehadiran (kunjungan_id);

-- 10. Triggers: Auto update kunjungan status when photo is added
CREATE OR REPLACE FUNCTION public.handle_foto_inserted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.kunjungan
    SET status = 'tercatat'
    WHERE id = NEW.kunjungan_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_foto_inserted ON public.foto_kehadiran;
CREATE TRIGGER on_foto_inserted
    AFTER INSERT ON public.foto_kehadiran
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_foto_inserted();

-- Trigger: Revert status to menunggu_foto if all photos are deleted
CREATE OR REPLACE FUNCTION public.handle_foto_deleted()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.foto_kehadiran WHERE kunjungan_id = OLD.kunjungan_id) THEN
        UPDATE public.kunjungan
        SET status = 'menunggu_foto'
        WHERE id = OLD.kunjungan_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_foto_deleted ON public.foto_kehadiran;
CREATE TRIGGER on_foto_deleted
    AFTER DELETE ON public.foto_kehadiran
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_foto_deleted();

-- 11. Row Level Security (RLS)
-- Di sini hanya RLS dasar + akses baca publik untuk data master aktif.
-- Policy staf/admin (berbasis role), RPC pencatatan kunjungan, dan policy storage
-- ada di supabase/migration_hardening.sql, WAJIB dijalankan setelah file ini.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instansi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foto_kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_token ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active instansi" ON public.instansi;
CREATE POLICY "Public can view active instansi" ON public.instansi FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active bidang" ON public.bidang;
CREATE POLICY "Public can view active bidang" ON public.bidang FOR SELECT USING (is_active = true);

-- ==============================================================================
-- 12. KODE SQL BUCKET STORAGE: foto-kehadiran
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'foto-kehadiran',
    'foto-kehadiran',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Catatan: RLS pada storage.objects sudah aktif secara bawaan di Supabase.

-- Policy storage.objects (khusus staf aktif) didefinisikan di migration_hardening.sql.

-- ==============================================================================
-- 13. SEED DATA: Instansi & Bidang
-- ==============================================================================
INSERT INTO public.instansi (nama, is_active) VALUES
('Sekretariat Daerah Kabupaten Bangli', true),
('Inspektorat Kabupaten Bangli', true),
('Badan Pengelola Keuangan, Pendapatan dan Aset Daerah (BPKPAD)', true),
('Badan Kepegawaian dan Pengembangan SDM (BKPSDM)', true),
('Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan (Bapperida)', true),
('Dinas Pendidikan, Pemuda dan Olahraga (Disdikpora)', true),
('Dinas Kesehatan', true),
('Dinas Pekerjaan Umum, Penataan Ruang, Perumahan dan Kawasan Permukiman', true),
('Dinas Komunikasi, Informatika dan Persandian', true),
('Dinas Pertanian, Ketahanan Pangan dan Perikanan', true),
('Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu', true),
('Dinas Pariwisata dan Kebudayaan', true),
('Dinas Kependudukan dan Pencatatan Sipil', true),
('Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak', true),
('Satuan Polisi Pamong Praja dan Pemadam Kebakaran', true),
('RSUD Bangli', true),
('Kecamatan Bangli', true),
('Kecamatan Kintamani', true),
('Kecamatan Susut', true),
('Kecamatan Tembuku', true)
ON CONFLICT (nama) DO NOTHING;

INSERT INTO public.bidang (nama, urutan, is_active) VALUES
('Sekretariat', 1, true),
('Inspektur Pembantu Wilayah I', 2, true),
('Inspektur Pembantu Wilayah II', 3, true),
('Inspektur Pembantu Wilayah III', 4, true),
('Inspektur Pembantu Wilayah IV', 5, true),
('Inspektur Pembantu Khusus / Investigasi', 6, true)
ON CONFLICT (nama) DO NOTHING;

-- ==============================================================================
-- AKUN ADMINISTRATOR PERTAMA
-- Kredensial TIDAK lagi ditulis di repo. Buat admin pertama secara manual:
--   1. Supabase Dashboard > Authentication > Users > "Add user" (centang Auto Confirm),
--      gunakan password yang kuat dan unik.
--   2. Jalankan SQL berikut (ganti email & nama):
--
--   INSERT INTO public.users (id, nama, email, role, is_active)
--   SELECT id, 'Administrator', email, 'admin', true
--   FROM auth.users WHERE email = 'ganti-dengan-email-admin@instansi.go.id'
--   ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
--
-- Akun petugas berikutnya dibuat dari menu Pengguna di dashboard.
-- Setelah ini jalankan supabase/migration_hardening.sql.
-- ==============================================================================
