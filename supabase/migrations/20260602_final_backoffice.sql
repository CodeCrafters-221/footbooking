-- SCRIPT DE MISE À JOUR BASE DE DONNÉES - BACK-OFFICE FINALISATION
-- À exécuter dans le SQL Editor de Supabase.

-- 1. Ajout de la colonne backup_role dans la table public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS backup_role text DEFAULT null;

-- 2. Création de la table platform_settings (configuration globale et mode maintenance)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
    maintenance_mode boolean DEFAULT false,
    maintenance_message text DEFAULT 'La plateforme est actuellement en maintenance.',
    platform_fee numeric DEFAULT 5,
    allow_new_registrations boolean DEFAULT true,
    contact_email text DEFAULT 'contact@footbooking.com',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Activation de la RLS sur platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Lecture autorisée pour tout le monde
DROP POLICY IF EXISTS "Allow anyone to read platform settings" ON public.platform_settings;
CREATE POLICY "Allow anyone to read platform settings" 
ON public.platform_settings FOR SELECT 
USING (true);

-- RLS: Écriture/Modification réservée aux super admins
DROP POLICY IF EXISTS "Only super admins can modify platform settings" ON public.platform_settings;
CREATE POLICY "Only super admins can modify platform settings" 
ON public.platform_settings FOR ALL 
TO authenticated 
USING (public.is_super_admin());

-- Insertion de la ligne par défaut
INSERT INTO public.platform_settings (id, maintenance_mode, maintenance_message, platform_fee, allow_new_registrations, contact_email)
VALUES (true, false, 'La plateforme est actuellement en maintenance.', 5, true, 'contact@footbooking.com')
ON CONFLICT (id) DO NOTHING;


-- 3. Création de la table reports (signalements)
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type text NOT NULL, -- values: 'complaint', 'request', 'bug', 'abuse'
    subject text,
    description text,
    status text DEFAULT 'open', -- values: 'open', 'in_progress', 'resolved', 'closed' (or 'nouveau', 'en_cours', 'resolu', 'rejete')
    priority text DEFAULT 'medium', -- values: 'low', 'medium', 'high', 'urgent'
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type text, -- 'utilisateur', 'terrain', 'reservation'
    target_label text -- Label de la cible (ex: 'Terrain Oasis Sport')
);

-- Activation de la RLS sur reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS: Les utilisateurs peuvent lire leurs propres rapports, les admins peuvent tout lire
DROP POLICY IF EXISTS "Users can read their own reports or super admins can read all" ON public.reports;
CREATE POLICY "Users can read their own reports or super admins can read all"
ON public.reports FOR SELECT
USING (auth.uid() = user_id OR public.is_super_admin());

-- RLS: Les utilisateurs ou les admins peuvent insérer des rapports
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

-- RLS: Les super admins peuvent gérer (update/delete) tous les rapports
DROP POLICY IF EXISTS "Super admins can manage all reports" ON public.reports;
CREATE POLICY "Super admins can manage all reports"
ON public.reports FOR ALL
USING (public.is_super_admin());


-- 4. Création de la table report_comments (commentaires de signalements)
CREATE TABLE IF NOT EXISTS public.report_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Activation de la RLS sur report_comments
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- RLS: Lecture autorisée pour l'auteur du signalement ou un admin
DROP POLICY IF EXISTS "Users can read comments on their own reports or super admins" ON public.report_comments;
CREATE POLICY "Users can read comments on their own reports or super admins"
ON public.report_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_id AND (reports.user_id = auth.uid() OR public.is_super_admin())
  )
);

-- RLS: Ajout de commentaire autorisé pour l'auteur ou un admin
DROP POLICY IF EXISTS "Users can add comments to their own reports or super admins" ON public.report_comments;
CREATE POLICY "Users can add comments to their own reports or super admins"
ON public.report_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_id AND (reports.user_id = auth.uid() OR public.is_super_admin())
  )
);

-- RLS: Gestion complète pour les super admins
DROP POLICY IF EXISTS "Super admins can delete comments" ON public.report_comments;
CREATE POLICY "Super admins can delete comments"
ON public.report_comments FOR ALL
USING (public.is_super_admin());


-- 5. Création de la table notifications (notifications admin)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- 'booking', 'user', 'log', 'report'
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    link text,
    meta text
);

-- Activation de la RLS sur notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Accès complet limité aux super admins
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;
CREATE POLICY "Super admins can manage all notifications"
ON public.notifications FOR ALL
USING (public.is_super_admin());


-- 6. Mise en place des triggers pour l'alimentation automatique des notifications admin

-- 6a. Trigger pour les réservations en attente
CREATE OR REPLACE FUNCTION public.handle_reservation_notification()
RETURNS trigger AS $$
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_reservation_notification ON public.reservations;
CREATE TRIGGER tr_reservation_notification
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_notification();


-- 6b. Trigger pour les inscriptions de nouveaux profils
CREATE OR REPLACE FUNCTION public.handle_profile_notification()
RETURNS trigger AS $$
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_profile_notification ON public.profiles;
CREATE TRIGGER tr_profile_notification
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_notification();


-- 6c. Trigger pour les nouvelles actions admin logs
CREATE OR REPLACE FUNCTION public.handle_admin_log_notification()
RETURNS trigger AS $$
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_log_notification ON public.admin_logs;
CREATE TRIGGER tr_admin_log_notification
AFTER INSERT ON public.admin_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_log_notification();
