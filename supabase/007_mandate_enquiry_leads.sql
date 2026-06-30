-- Migration: 007_mandate_enquiry_leads.sql
-- Creates the leads table for tracking mandate enquiries from new registrations

CREATE TABLE IF NOT EXISTS leads (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  mobile          TEXT        NOT NULL DEFAULT '',
  email           TEXT        NOT NULL DEFAULT '',
  mandate_title   TEXT        NOT NULL,
  mandate_type    TEXT        NOT NULL,
  mandate_company TEXT        NOT NULL,
  mandate_asset   TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS — all access goes through the service-role backend
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
