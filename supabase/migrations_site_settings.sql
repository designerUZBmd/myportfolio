-- ==============================================================================
-- MIGRATION: Site Settings (Favicon & Dynamic Tab Title Rotation)
-- Ushbu SQL kodini Supabase boshqaruv panelidagi SQL Editor da ishga tushiring:
-- Supabase Dashboard -> Project -> SQL Editor -> Yangi so'rov (New query) -> Run
-- ==============================================================================

-- 1. home_settings jadvaliga favicon va dinamik tab sarlavhasi ustunlarini qo'shish
ALTER TABLE home_settings
ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS title_words JSONB DEFAULT '["Obloqulov", "Digital Designer", "Creative Developer"]'::jsonb,
ADD COLUMN IF NOT EXISTS title_rotation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS title_rotation_interval NUMERIC DEFAULT 2.5;

-- 2. Agar default qator mavjud bo'lsa, qiymatlarni sozlash
UPDATE home_settings
SET 
  favicon_url = COALESCE(favicon_url, ''),
  title_words = COALESCE(title_words, '["Obloqulov", "Digital Designer", "Creative Developer"]'::jsonb),
  title_rotation_enabled = COALESCE(title_rotation_enabled, true),
  title_rotation_interval = COALESCE(title_rotation_interval, 2.5)
WHERE id = 'default';
