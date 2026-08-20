-- Ajout de la colonne capacity à la table fields
-- Représente le nombre total de joueurs (ex: 10 pour un 5x5)

ALTER TABLE public.fields
ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 10;
