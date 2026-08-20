-- FIX: Add missing foreign key reservations.user_id -> profiles.id
-- (PostgREST cannot embed profiles:user_id join without an FK)

-- 1. Clean up orphaned user_ids (no matching profile) to avoid FK violation
UPDATE public.reservations SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = reservations.user_id);

-- 2. Add the missing foreign key constraint
ALTER TABLE public.reservations
ADD CONSTRAINT fk_reservations_user_id
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;