-- ==============================================================================
-- SIKUNJUNG: Skrip Perbaikan & Pembuatan Akun Administrator
-- Email: admin@bangli.go.id
-- Password: inspektorat234!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bersihkan record lama (jika ada yang belum lengkap di auth.users / public.users)
DELETE FROM auth.users WHERE email = 'admin@bangli.go.id';
DELETE FROM public.users WHERE email = 'admin@bangli.go.id';

-- 2. Buat akun Admin lengkap beserta auth.identities
DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
BEGIN
    -- 2A. Insert ke auth.users
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

    -- 2B. Insert ke auth.identities (WAJIB agar GoTrue Supabase mengenali email/password)
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

    -- 2C. Insert ke public.users sebagai role 'admin'
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

