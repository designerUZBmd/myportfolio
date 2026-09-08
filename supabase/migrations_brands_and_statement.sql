-- ==============================================================================
-- 1. HOME_SETTINGS GA YANGI USTUNLAR QO'SHISH
-- ==============================================================================
ALTER TABLE home_settings 
ADD COLUMN IF NOT EXISTS directions_statement TEXT DEFAULT 'Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.';

ALTER TABLE home_settings 
ADD COLUMN IF NOT EXISTS brands_label VARCHAR(100) DEFAULT 'MEN ISHLAGAN BRENDLAR /';

-- Default qatordagi qiymatlarni yangilash (agar bo'sh bo'lsa)
UPDATE home_settings
SET 
  directions_statement = COALESCE(directions_statement, 'Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.'),
  brands_label = COALESCE(brands_label, 'MEN ISHLAGAN BRENDLAR /')
WHERE id = 'default';


-- ==============================================================================
-- 2. BRANDS (BRENDLAR / HAMKORLAR) JADVALI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT DEFAULT '',
  height INTEGER NOT NULL DEFAULT 240,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) yoqish
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Ommaviy ko'rish huquqi
CREATE POLICY "Public brands read access" 
  ON brands FOR SELECT 
  USING (true);

-- Admin uchun to'liq huquq
CREATE POLICY "Authenticated admin full access on brands" 
  ON brands FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Boshlang'ich 12 ta brendni kiritish (agar mavjud bo'lmasa)
INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'PAYME', '', 280, 1, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'PAYME');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'UZUM', '', 190, 2, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'UZUM');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'EPAM', '', 330, 3, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'EPAM');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'CLICK', '', 220, 4, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'CLICK');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'KAPITALBANK', '', 300, 5, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'KAPITALBANK');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'YANDEX', '', 170, 6, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'YANDEX');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'BEELINE', '', 270, 7, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'BEELINE');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'IT PARK', '', 200, 8, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'IT PARK');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'ANORBANK', '', 310, 9, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'ANORBANK');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'UCELL', '', 180, 10, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'UCELL');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'TBC BANK', '', 310, 11, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'TBC BANK');

INSERT INTO brands (name, logo_url, height, "order", is_active)
SELECT 'NOVA AI', '', 210, 12, true WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'NOVA AI');
