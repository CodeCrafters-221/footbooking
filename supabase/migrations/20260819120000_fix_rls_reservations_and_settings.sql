-- FIX: Super admin RLS policies for reservations + settings update verification

-- 1. Allow super admins to read all reservations (for admin back-office)
DROP POLICY IF EXISTS "Super admins can read all reservations" ON public.reservations;
CREATE POLICY "Super admins can read all reservations"
ON public.reservations FOR SELECT
USING (public.is_super_admin());

-- 2. Allow super admins to update all reservations (validate, cancel, etc.)
DROP POLICY IF EXISTS "Super admins can update all reservations" ON public.reservations;
CREATE POLICY "Super admins can update all reservations"
ON public.reservations FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 3. Allow super admins to insert reservations (if needed for admin-created bookings)
DROP POLICY IF EXISTS "Super admins can insert reservations" ON public.reservations;
CREATE POLICY "Super admins can insert reservations"
ON public.reservations FOR INSERT
WITH CHECK (public.is_super_admin());
