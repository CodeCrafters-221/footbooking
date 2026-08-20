-- SCRIPT DE CORRECTION ERREUR 500 (Récursion Infinie RLS)
-- À exécuter dans le SQL Editor de Supabase

-- 1. On supprime les anciennes policies qui causaient la boucle infinie
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all fields" ON public.fields;
DROP POLICY IF EXISTS "Super admins can view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Super admins can insert logs" ON public.admin_logs;

-- 2. On crée une fonction sécurisée (SECURITY DEFINER) pour lire le rôle sans déclencher la RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT (role = 'super_admin') INTO is_admin 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN coalesce(is_admin, false);
END;
$$;

-- 3. On recrée les policies en utilisant la nouvelle fonction (pas de boucle infinie !)
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all fields" ON public.fields
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Super admins can view logs" ON public.admin_logs
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can insert logs" ON public.admin_logs
    FOR INSERT WITH CHECK (public.is_super_admin());
