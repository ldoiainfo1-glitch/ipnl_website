-- =====================================================================
-- Migration: 002_admin_moderation.sql
-- Adds persistent storage for:
--   1. kyc_reviews   – one row per user, tracks KYC decision history
--   2. mandate_reviews – one row per mandate, tracks approval decisions
--   3. audit_log     – append-only admin action trail
-- Also extends profiles with KYC status + moderation columns.
--
-- Safe to re-run: all DDL uses IF NOT EXISTS / DO-EXCEPTION guards.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 1. Extend profiles with KYC & moderation columns
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status  text NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS mobile      text,
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS website     text,
  ADD COLUMN IF NOT EXISTS linkedin    text,
  ADD COLUMN IF NOT EXISTS logo        text,
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS state       text,
  ADD COLUMN IF NOT EXISTS pan         text,
  ADD COLUMN IF NOT EXISTS gst         text,
  ADD COLUMN IF NOT EXISTS rera_number text,
  ADD COLUMN IF NOT EXISTS reputation_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS asset_preferences text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ticket_size_min numeric,
  ADD COLUMN IF NOT EXISTS ticket_size_max numeric,
  ADD COLUMN IF NOT EXISTS intro_quota_limit integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intro_quota_used  integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status      ON public.profiles(status);

-- ---------------------------------------------------------------------
-- 2. kyc_reviews table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'SUBMITTED',   -- SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED
  pan_card         text,
  gst_certificate  text,
  rera_certificate text,
  incorporation_certificate text,
  address_proof    text,
  review_note      text,                  -- admin "in-progress" note
  rejection_reason text,                  -- shown to user when REJECTED
  reviewed_by      uuid REFERENCES public.profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Only one active review per user (upsert on user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_reviews_user_id ON public.kyc_reviews(user_id);
CREATE INDEX        IF NOT EXISTS idx_kyc_reviews_status  ON public.kyc_reviews(status);

-- Keep kyc_status in profiles in sync automatically
CREATE OR REPLACE FUNCTION public.sync_kyc_status_to_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
     SET kyc_status = NEW.status, updated_at = now()
   WHERE id = NEW.user_id;
  -- When approved, also upgrade tier
  IF NEW.status = 'APPROVED' THEN
    UPDATE public.profiles
       SET tier = 'VERIFIED', status = 'APPROVED', updated_at = now()
     WHERE id = NEW.user_id AND tier = 'OBSERVER';
     UPDATE public.profiles
       SET status = 'APPROVED', updated_at = now()
      WHERE id = NEW.user_id AND tier <> 'OBSERVER';
    ELSIF NEW.status = 'REJECTED' THEN
     UPDATE public.profiles
       SET status = 'REJECTED', updated_at = now()
      WHERE id = NEW.user_id AND status <> 'SUSPENDED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_kyc_status ON public.kyc_reviews;
CREATE TRIGGER trigger_sync_kyc_status
AFTER INSERT OR UPDATE OF status ON public.kyc_reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_kyc_status_to_profile();

UPDATE public.profiles p
  SET status = 'APPROVED', tier = CASE WHEN p.tier = 'OBSERVER' THEN 'VERIFIED' ELSE p.tier END, updated_at = now()
  FROM public.kyc_reviews kr
 WHERE kr.user_id = p.id
  AND kr.status = 'APPROVED'
  AND p.status <> 'SUSPENDED';

DROP TRIGGER IF EXISTS set_updated_at_on_kyc_reviews ON public.kyc_reviews;
CREATE TRIGGER set_updated_at_on_kyc_reviews
BEFORE UPDATE ON public.kyc_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: user can read their own; service_role (backend) can do anything
ALTER TABLE public.kyc_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kyc_reviews_select_own ON public.kyc_reviews;
CREATE POLICY kyc_reviews_select_own ON public.kyc_reviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS kyc_reviews_insert_self ON public.kyc_reviews;
CREATE POLICY kyc_reviews_insert_self ON public.kyc_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins update via service-role key (bypasses RLS), so no extra policy needed

-- ---------------------------------------------------------------------
-- 3. mandate_reviews table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mandate_reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id       uuid NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'PENDING',   -- PENDING | UNDER_REVIEW | APPROVED | REJECTED
  note             text,
  reviewed_by      uuid REFERENCES public.profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- One review record per mandate (upsert on mandate_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_reviews_mandate_id ON public.mandate_reviews(mandate_id);
CREATE INDEX        IF NOT EXISTS idx_mandate_reviews_status     ON public.mandate_reviews(status);

DROP TRIGGER IF EXISTS set_updated_at_on_mandate_reviews ON public.mandate_reviews;
CREATE TRIGGER set_updated_at_on_mandate_reviews
BEFORE UPDATE ON public.mandate_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mandate_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mandate_reviews_select_owner ON public.mandate_reviews;
CREATE POLICY mandate_reviews_select_owner ON public.mandate_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_id AND m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4. audit_log table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL REFERENCES public.profiles(id),
  action       text NOT NULL,         -- e.g. 'KYC_APPROVED', 'MANDATE_REJECTED'
  entity_type  text NOT NULL,         -- 'kyc_review' | 'mandate_review' | 'user'
  entity_id    uuid NOT NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id    ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id   ON public.audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Only service_role (backend admin client) inserts; no direct user access needed

-- ---------------------------------------------------------------------
-- 5. Backfill: mandates submitted before this migration default to PENDING.
-- Existing ACTIVE mandates without an explicit approved review are moved back
-- to DRAFT so they do not appear in marketplace until admin approval.
-- ---------------------------------------------------------------------
INSERT INTO public.mandate_reviews (mandate_id, status)
SELECT m.id, 'PENDING'
FROM public.mandates m
LEFT JOIN public.mandate_reviews mr ON mr.mandate_id = m.id
WHERE mr.id IS NULL
ON CONFLICT (mandate_id) DO NOTHING;

UPDATE public.mandates m
SET status = 'DRAFT', updated_at = now()
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM public.mandate_reviews mr
    WHERE mr.mandate_id = m.id
      AND mr.status = 'APPROVED'
  );
