-- Migration 006: Sync company_name from auth user_metadata to profiles
--
-- Problem: The handle_auth_user trigger only copied id/email when a new
-- auth user was created, leaving company_name NULL in profiles. The
-- company name was stored in auth.users.raw_user_meta_data but never
-- synced to the profiles table used by mandate/member queries.
-- This caused mandate cards to show "Unknown company" for all users.
--
-- Fix 1: Update the trigger to also copy company_name on INSERT.
-- Fix 2: Backfill all existing profiles where company_name is NULL.

-- ── Update trigger function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'companyName',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    -- Only fill in company_name if not already set by the user
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name),
    updated_at   = now();
  RETURN NEW;
END;
$$;

-- ── Backfill existing profiles ───────────────────────────────────────
-- For users who signed up before this migration, copy company_name from
-- auth.users.raw_user_meta_data where the profiles row has no value yet.
UPDATE public.profiles p
SET
  company_name = u.raw_user_meta_data->>'companyName',
  updated_at   = now()
FROM auth.users u
WHERE p.id             = u.id
  AND p.company_name   IS NULL
  AND u.raw_user_meta_data->>'companyName' IS NOT NULL
  AND (u.raw_user_meta_data->>'companyName') <> '';
