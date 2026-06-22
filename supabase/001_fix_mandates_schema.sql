-- =====================================================================
-- Migration: 001_fix_mandates_schema.sql
-- Brings public.mandates up to date with frontend types/index.ts:
--   Mandate, CreateMandateRequest, MandateFilters, MandateStatus, AssetClass
--
-- Safe to run against an existing Supabase project — uses
-- ADD COLUMN IF NOT EXISTS so it won't fail if some columns already
-- exist, and doesn't drop/recreate the table (no data loss).
-- Run this in Supabase SQL Editor, or via psql/the Supabase CLI.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- ENUMs used by mandates (created only if missing)
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE mandate_type AS ENUM ('BUY', 'SELL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mandate_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_class AS ENUM (
    'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'HOSPITALITY',
    'RETAIL', 'LAND', 'MIXED_USE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM (
    'RESIDENTIAL_LAND', 'COMMERCIAL_LAND', 'INDUSTRIAL_LAND',
    'PREMIUM_RESIDENTIAL', 'PLOTTED_DEVELOPMENT', 'SOCIETY_REDEVELOPMENT',
    'GRADE_A_OFFICE', 'RETAIL_MALL',
    'WAREHOUSING_LOGISTICS', 'DATA_CENTRES',
    'HOSPITALITY_RESORTS',
    'MIXED_USE_TOWNSHIPS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- Convert existing `type` and add all missing columns from Mandate type
-- ---------------------------------------------------------------------

-- `type` column already exists as `text` in the original schema.sql.
-- Convert it to the mandate_type enum (assumes existing values, if any,
-- are already 'BUY'/'SELL' or NULL).
DO $$ BEGIN
  ALTER TABLE public.mandates
    ALTER COLUMN type TYPE mandate_type USING type::mandate_type;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping type column conversion (already correct type or incompatible data): %', SQLERRM;
END $$;

ALTER TABLE public.mandates
  ADD COLUMN IF NOT EXISTS status mandate_status NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS asset_class asset_class,
  ADD COLUMN IF NOT EXISTS property_type property_type,
  ADD COLUMN IF NOT EXISTS built_up_area numeric,
  ADD COLUMN IF NOT EXISTS plot_area numeric,
  ADD COLUMN IF NOT EXISTS ticket_size_max numeric,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intro_count integer NOT NULL DEFAULT 0;

-- title/description should be NOT NULL per the Mandate type; only
-- enforce if the table is empty or already compliant, to avoid
-- breaking existing rows with NULLs in them.
DO $$ BEGIN
  ALTER TABLE public.mandates ALTER COLUMN description SET NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping NOT NULL on description (existing NULL rows present): %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------
-- assetClass: CreateMandateRequest only sends propertyType, but
-- MandateFilters filters by assetClass (the coarser AssetClass enum).
-- Derive asset_class from property_type automatically so callers never
-- have to set both. Adjust this mapping if your taxonomy differs.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.derive_asset_class_from_property_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.property_type IS NOT NULL THEN
    NEW.asset_class := CASE NEW.property_type
      WHEN 'RESIDENTIAL_LAND'      THEN 'LAND'
      WHEN 'COMMERCIAL_LAND'       THEN 'LAND'
      WHEN 'INDUSTRIAL_LAND'       THEN 'LAND'
      WHEN 'PREMIUM_RESIDENTIAL'   THEN 'RESIDENTIAL'
      WHEN 'PLOTTED_DEVELOPMENT'   THEN 'RESIDENTIAL'
      WHEN 'SOCIETY_REDEVELOPMENT' THEN 'RESIDENTIAL'
      WHEN 'GRADE_A_OFFICE'        THEN 'COMMERCIAL'
      WHEN 'RETAIL_MALL'           THEN 'RETAIL'
      WHEN 'WAREHOUSING_LOGISTICS' THEN 'INDUSTRIAL'
      WHEN 'DATA_CENTRES'          THEN 'INDUSTRIAL'
      WHEN 'HOSPITALITY_RESORTS'   THEN 'HOSPITALITY'
      WHEN 'MIXED_USE_TOWNSHIPS'   THEN 'MIXED_USE'
      ELSE NEW.asset_class
    END::asset_class;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_derive_asset_class ON public.mandates;
CREATE TRIGGER trigger_derive_asset_class
BEFORE INSERT OR UPDATE OF property_type ON public.mandates
FOR EACH ROW EXECUTE FUNCTION public.derive_asset_class_from_property_type();

-- ---------------------------------------------------------------------
-- Indexes to support MandateFilters (city, state, assetClass, type,
-- ticketSize range, sort by createdAt/ticketSize/viewCount)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mandates_status ON public.mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_type ON public.mandates(type);
CREATE INDEX IF NOT EXISTS idx_mandates_asset_class ON public.mandates(asset_class);
CREATE INDEX IF NOT EXISTS idx_mandates_city ON public.mandates(city);
CREATE INDEX IF NOT EXISTS idx_mandates_state ON public.mandates(state);
CREATE INDEX IF NOT EXISTS idx_mandates_ticket_size ON public.mandates(ticket_size);
CREATE INDEX IF NOT EXISTS idx_mandates_tags ON public.mandates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_mandates_created_at ON public.mandates(created_at);

-- ---------------------------------------------------------------------
-- RLS: mandates_update_owner / mandates_delete_owner already exist in
-- the original schema.sql and are correct (auth.uid() = user_id).
-- They remain the database-level safety net behind the new explicit
-- ownership checks added in the Express routes.
-- ---------------------------------------------------------------------
