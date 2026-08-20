-- SCRIPT DE MISE À JOUR BASE DE DONNÉES POUR BACK-OFFICE SUPER-ADMIN
-- À exécuter dans le SQL Editor de Supabase.

-- 1. Ajout des colonnes pour la table `fields`
ALTER TABLE public.fields 
ADD COLUMN IF NOT EXISTS field_source text DEFAULT 'owner',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Contraintes pour s'assurer des bonnes valeurs (optionnel mais recommandé)
-- ALTER TABLE public.fields ADD CONSTRAINT check_field_source CHECK (field_source IN ('owner', 'admin'));
-- ALTER TABLE public.fields ADD CONSTRAINT check_field_status CHECK (status IN ('active', 'inactive', 'pending_verification'));

-- 2. Création de la table `admin_logs`
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_table text,
    target_id text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Activation de la RLS sur admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admins peuvent voir les logs
CREATE POLICY "Super admins can view logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- Seuls les super_admins peuvent créer des logs
CREATE POLICY "Super admins can insert logs" ON public.admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- 3. Mise à jour des policies (RLS) existantes
-- (Assurez-vous que les super_admins peuvent tout faire sur les tables principales)

-- Exemple pour la table profiles (à adapter selon vos policies existantes)
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- Exemple pour la table fields
CREATE POLICY "Super admins can manage all fields" ON public.fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- 4. Astuce pour vous donner les droits super_admin pour tester
-- Décommentez la ligne suivante et remplacez 'VOTRE_EMAIL' par votre adresse email de connexion :
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'VOTRE_EMAIL';
