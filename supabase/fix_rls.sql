-- ==============================================================================
-- Perbaikan RLS Infinite Recursion pada public.users
-- ==============================================================================

-- 1. Hapus kebijakan lama yang menyebabkan recursive loop
DROP POLICY IF EXISTS "Admin can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view profile" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read users" ON public.users;
DROP POLICY IF EXISTS "Allow user update own profile" ON public.users;

-- 2. Kebijakan baru yang bersih dan tanpa rekursi:
-- Semua user yang login dapat membaca data profil di public.users
CREATE POLICY "Allow authenticated read users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- User dapat mengedit profil miliknya sendiri
CREATE POLICY "Allow user update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

