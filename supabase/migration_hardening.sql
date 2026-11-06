-- ==============================================================================
-- SIKUNJUNG: Migrasi Hardening (jalankan SETELAH schema.sql, aman dijalankan ulang)
--   1. Fungsi RPC atomik untuk mencatat kunjungan (nomor urut tanpa race condition,
--      bisa dipanggil tamu anonim tanpa membuka SELECT/INSERT langsung ke tabel)
--   2. Kolom jumlah_laki / jumlah_perempuan (statistik gender yang bisa dihitung)
--   3. RLS berbasis role (admin vs petugas) + akun nonaktif tidak punya akses
--   4. Perbaikan eskalasi role pada tabel users
-- ==============================================================================

-- 1. Kolom jumlah per gender -----------------------------------------------------
ALTER TABLE public.kunjungan ADD COLUMN IF NOT EXISTS jumlah_laki INT;
ALTER TABLE public.kunjungan ADD COLUMN IF NOT EXISTS jumlah_perempuan INT;

-- Index idx_kunjungan_tanggal redundan dengan UNIQUE (tanggal, nomor_urut)
DROP INDEX IF EXISTS public.idx_kunjungan_tanggal;

-- 2. Helper role -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_active = true AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. RPC pencatatan kunjungan ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tambah_kunjungan(
    p_nama TEXT,
    p_no_telepon TEXT,
    p_instansi_id UUID,
    p_instansi_lainnya TEXT,
    p_bidang_id UUID,
    p_keperluan TEXT,
    p_jumlah_laki INT,
    p_jumlah_perempuan INT,
    p_jenis_kelamin TEXT,
    p_consent BOOLEAN,
    p_sumber TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_today DATE := (now() AT TIME ZONE 'Asia/Makassar')::date;
    v_uid UUID := auth.uid();
    v_creator UUID;
    v_sumber kunjungan_sumber;
    v_nomor INT;
    v_laki INT := COALESCE(p_jumlah_laki, 0);
    v_perempuan INT := COALESCE(p_jumlah_perempuan, 0);
    v_row public.kunjungan;
BEGIN
    IF p_nama IS NULL OR char_length(btrim(p_nama)) = 0 OR char_length(p_nama) > 150 THEN
        RAISE EXCEPTION 'Nama lengkap wajib diisi (maksimal 150 karakter).';
    END IF;
    IF p_keperluan IS NULL OR char_length(btrim(p_keperluan)) = 0 OR char_length(p_keperluan) > 500 THEN
        RAISE EXCEPTION 'Keperluan wajib diisi (maksimal 500 karakter).';
    END IF;
    IF p_no_telepon IS NOT NULL AND char_length(p_no_telepon) > 30 THEN
        RAISE EXCEPTION 'Nomor telepon terlalu panjang.';
    END IF;
    IF p_instansi_lainnya IS NOT NULL AND char_length(p_instansi_lainnya) > 200 THEN
        RAISE EXCEPTION 'Nama instansi terlalu panjang.';
    END IF;
    IF v_laki < 0 OR v_perempuan < 0 OR v_laki > 99 OR v_perempuan > 99 OR v_laki + v_perempuan < 1 THEN
        RAISE EXCEPTION 'Jumlah tamu tidak valid.';
    END IF;
    IF p_consent IS NOT TRUE THEN
        RAISE EXCEPTION 'Persetujuan penggunaan data wajib diberikan.';
    END IF;
    IF p_instansi_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.instansi WHERE id = p_instansi_id AND is_active
    ) THEN
        RAISE EXCEPTION 'Instansi tidak valid.';
    END IF;
    IF p_bidang_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.bidang WHERE id = p_bidang_id AND is_active
    ) THEN
        RAISE EXCEPTION 'Bidang tidak valid.';
    END IF;

    -- Pembuat & sumber ditentukan server, bukan dipercaya dari klien.
    IF v_uid IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.users WHERE id = v_uid AND is_active
    ) THEN
        v_creator := v_uid;
        v_sumber := CASE WHEN p_sumber = 'qr' THEN 'qr' ELSE 'petugas' END::kunjungan_sumber;
    ELSE
        v_creator := NULL;
        v_sumber := 'qr';
    END IF;

    -- Serialisasi per hari: dua tamu bersamaan tidak akan mendapat nomor yang sama.
    PERFORM pg_advisory_xact_lock(hashtext('kunjungan_nomor_' || v_today::text));

    SELECT COALESCE(MAX(nomor_urut), 0) + 1 INTO v_nomor
    FROM public.kunjungan WHERE tanggal = v_today;

    INSERT INTO public.kunjungan (
        tanggal, nomor_urut, nama, jenis_kelamin, no_telepon, instansi_id, instansi_lainnya,
        bidang_id, keperluan, jumlah_tamu, jumlah_laki, jumlah_perempuan, sumber, status,
        consent, dibuat_oleh, waktu_masuk
    ) VALUES (
        v_today, v_nomor, btrim(p_nama), COALESCE(NULLIF(btrim(p_jenis_kelamin), ''), 'Laki-laki'),
        NULLIF(btrim(p_no_telepon), ''), p_instansi_id, NULLIF(btrim(p_instansi_lainnya), ''),
        p_bidang_id, btrim(p_keperluan), v_laki + v_perempuan, v_laki, v_perempuan, v_sumber,
        'menunggu_foto', true, v_creator, now()
    )
    RETURNING * INTO v_row;

    RETURN to_jsonb(v_row)
        || jsonb_build_object(
            'instansi', (SELECT jsonb_build_object('id', i.id, 'nama', i.nama)
                         FROM public.instansi i WHERE i.id = v_row.instansi_id),
            'bidang', (SELECT jsonb_build_object('id', b.id, 'nama', b.nama)
                       FROM public.bidang b WHERE b.id = v_row.bidang_id)
        );
END;
$$;

REVOKE ALL ON FUNCTION public.tambah_kunjungan(TEXT, TEXT, UUID, TEXT, UUID, TEXT, INT, INT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tambah_kunjungan(TEXT, TEXT, UUID, TEXT, UUID, TEXT, INT, INT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;

-- 4. RLS ----------------------------------------------------------------------------
-- Insert langsung oleh publik ditutup; semua pencatatan lewat tambah_kunjungan().
DROP POLICY IF EXISTS "Public can insert kunjungan" ON public.kunjungan;
DROP POLICY IF EXISTS "Authenticated can manage kunjungan" ON public.kunjungan;
DROP POLICY IF EXISTS "Staff can read kunjungan" ON public.kunjungan;
DROP POLICY IF EXISTS "Staff can insert kunjungan" ON public.kunjungan;
DROP POLICY IF EXISTS "Staff can update kunjungan" ON public.kunjungan;
DROP POLICY IF EXISTS "Admin can delete kunjungan" ON public.kunjungan;
CREATE POLICY "Staff can read kunjungan" ON public.kunjungan FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert kunjungan" ON public.kunjungan FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update kunjungan" ON public.kunjungan FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Admin can delete kunjungan" ON public.kunjungan FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can manage foto" ON public.foto_kehadiran;
DROP POLICY IF EXISTS "Staff can manage foto" ON public.foto_kehadiran;
CREATE POLICY "Staff can manage foto" ON public.foto_kehadiran FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Instansi & bidang: publik hanya membaca yang aktif, staf membaca semua, admin menulis.
DROP POLICY IF EXISTS "Authenticated can manage instansi" ON public.instansi;
DROP POLICY IF EXISTS "Staff can read instansi" ON public.instansi;
DROP POLICY IF EXISTS "Admin can write instansi" ON public.instansi;
CREATE POLICY "Staff can read instansi" ON public.instansi FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Admin can write instansi" ON public.instansi FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can manage bidang" ON public.bidang;
DROP POLICY IF EXISTS "Staff can read bidang" ON public.bidang;
DROP POLICY IF EXISTS "Admin can write bidang" ON public.bidang;
CREATE POLICY "Staff can read bidang" ON public.bidang FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Admin can write bidang" ON public.bidang FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users: tidak ada policy UPDATE/INSERT/DELETE untuk klien (perubahan role hanya lewat
-- service role di server). Pengguna hanya membaca profil sendiri; admin membaca semua.
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read users" ON public.users;
DROP POLICY IF EXISTS "Read own or admin" ON public.users;
CREATE POLICY "Read own or admin" ON public.users FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

-- Storage foto kehadiran: hanya staf aktif.
DROP POLICY IF EXISTS "Petugas can upload foto" ON storage.objects;
DROP POLICY IF EXISTS "Petugas can read foto" ON storage.objects;
DROP POLICY IF EXISTS "Petugas can delete foto" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload foto" ON storage.objects;
DROP POLICY IF EXISTS "Staff can read foto" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete foto" ON storage.objects;
CREATE POLICY "Staff can upload foto" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'foto-kehadiran' AND public.is_staff());
CREATE POLICY "Staff can read foto" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'foto-kehadiran' AND public.is_staff());
CREATE POLICY "Staff can delete foto" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'foto-kehadiran' AND public.is_staff());
