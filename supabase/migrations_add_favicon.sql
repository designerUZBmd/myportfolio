-- ==============================================================================
-- MIGRATION: Add favicon_url column to home_settings
-- ==============================================================================
ALTER TABLE home_settings
ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '';
