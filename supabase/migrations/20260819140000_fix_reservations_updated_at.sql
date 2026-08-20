-- FIX: BookingDetail needs updated_at on reservations
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
