-- ==============================================================================
-- SIKUNJUNG: Konfigurasi Storage Bucket & Akun Administrator
-- Inspektorat Daerah Kabupaten Bangli
-- ==============================================================================

-- 1. Ekstensi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. KODE SQL BUCKET STORAGE: foto-kehadiran
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

-- Policies on storage.objects
DROP POLICY IF EXISTS "Petugas can upload foto" ON storage.objects;
CREATE POLICY "Petugas can upload foto"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'foto-kehadiran');

DROP POLICY IF EXISTS "Petugas can read foto" ON storage.objects;
CREATE POLICY "Petugas can read foto"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'foto-kehadiran');

DROP POLICY IF EXISTS "Petugas can delete foto" ON storage.objects;
CREATE POLICY "Petugas can delete foto"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'foto-kehadiran');

-- ==============================================================================
-- 3. PEMBUATAN AKUN ADMINISTRATOR UTAMA
-- Email: admin@bangli.go.id
-- Password: inspektorat234!
-- ==============================================================================

DELETE FROM auth.users WHERE email = 'admin@bangli.go.id';
DELETE FROM public.users WHERE email = 'admin@bangli.go.id';

DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token,
        is_super_admin
    ) VALUES (
        new_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@bangli.go.id',
        crypt('inspektorat234!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"nama":"Administrator IT Inspektorat"}',
        now(),
        now(),
        'authenticated',
        'authenticated',
        '',
        false
    );

    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_admin_id,
        format('{"sub":"%s","email":"%s"}', new_admin_id, 'admin@bangli.go.id')::jsonb,
        'email',
        'admin@bangli.go.id',
        now(),
        now(),
        now()
    );

    INSERT INTO public.users (
        id,
        nama,
        email,
        role,
        is_active,
        created_at
    ) VALUES (
        new_admin_id,
        'Administrator IT Inspektorat',
        'admin@bangli.go.id',
        'admin',
        true,
        now()
    );
END $$;
