-- FIX: Registration, profile creation, and reservation creation are broken.
-- Root cause: Notification triggers INSERT into `notifications` (RLS: super_admin only).
-- When the INSERT fails for non-admin users, it rolls back the entire parent transaction.
-- Fix: Make triggers resilient + add INSERT policies for regular users.

-- ============================================================
-- 1. RESILIENT TRIGGER FUNCTIONS (catch errors, never block parent)
-- ============================================================

-- 1a. handle_profile_notification: wrap in exception block
CREATE OR REPLACE FUNCTION public.handle_profile_notification()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.notifications (title, message, type, link, meta, created_at)
    VALUES (
      'Nouvel utilisateur',
      coalesce(NEW.name, 'Sans nom') || ' (' || coalesce(NEW.role, 'user') || ')',
      'user',
      '/admin/utilisateurs',
      NEW.role,
      coalesce(NEW.created_at, now())
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_profile_notification failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1b. handle_reservation_notification: wrap in exception block
CREATE OR REPLACE FUNCTION public.handle_reservation_notification()
RETURNS trigger AS $$
BEGIN
  BEGIN
    IF NEW.status IN ('En attente', 'En attente de paiement') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO public.notifications (title, message, type, link, meta, created_at)
      VALUES (
        'Réservation en attente',
        coalesce(NEW.client_name, 'Client') || ' — ' || coalesce((SELECT name FROM public.fields WHERE id = NEW.field_id), 'Terrain'),
        'booking',
        '/admin/reservations',
        NEW.status,
        NEW.created_at
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_reservation_notification failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1c. handle_admin_log_notification: wrap in exception block
CREATE OR REPLACE FUNCTION public.handle_admin_log_notification()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.notifications (title, message, type, link, meta, created_at)
    VALUES (
      'Action admin',
      NEW.action || ' — ' || coalesce((SELECT name FROM public.profiles WHERE id = NEW.admin_id), 'Admin'),
      'log',
      '/admin',
      NEW.target_table,
      NEW.created_at
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_admin_log_notification failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. INSERT POLICIES for regular authenticated users
-- ============================================================

-- 2a. Profiles: users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2b. Profiles: users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2c. Reservations: authenticated users can insert reservations
DROP POLICY IF EXISTS "Users can insert their own reservations" ON public.reservations;
CREATE POLICY "Users can insert their own reservations"
ON public.reservations FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2d. Reservations: authenticated users can read their own reservations
DROP POLICY IF EXISTS "Users can read their own reservations" ON public.reservations;
CREATE POLICY "Users can read their own reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL OR public.is_super_admin());
