-- =====================================================================
-- Migration: 003_reputation_reviews.sql
-- Adds peer reviews used by the member reputation ranking.
-- Safe to re-run: all DDL uses IF NOT EXISTS / DO-EXCEPTION guards.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.reputation_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mandate_id   uuid REFERENCES public.mandates(id) ON DELETE SET NULL,
  rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  status       text NOT NULL DEFAULT 'PUBLISHED', -- PUBLISHED | HIDDEN
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reputation_reviews_no_self_review CHECK (reviewer_id <> reviewee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reputation_reviews_unique_pair_mandate
  ON public.reputation_reviews(reviewer_id, reviewee_id, mandate_id)
  WHERE mandate_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reputation_reviews_unique_pair_general
  ON public.reputation_reviews(reviewer_id, reviewee_id)
  WHERE mandate_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_reputation_reviews_reviewee_status
  ON public.reputation_reviews(reviewee_id, status);

CREATE INDEX IF NOT EXISTS idx_reputation_reviews_reviewer
  ON public.reputation_reviews(reviewer_id);

DROP TRIGGER IF EXISTS set_updated_at_on_reputation_reviews ON public.reputation_reviews;
CREATE TRIGGER set_updated_at_on_reputation_reviews
BEFORE UPDATE ON public.reputation_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reputation_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reputation_reviews_select_published ON public.reputation_reviews;
CREATE POLICY reputation_reviews_select_published ON public.reputation_reviews
  FOR SELECT USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS reputation_reviews_insert_self ON public.reputation_reviews;
CREATE POLICY reputation_reviews_insert_self ON public.reputation_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
