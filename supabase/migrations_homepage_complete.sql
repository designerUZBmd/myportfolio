-- ==============================================================================
-- 1. HOME_SETTINGS JADVALI (BOSH SAHIFA BARCHA SOZLAMALARI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS home_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  
  -- 1. Hero bo'limi
  hero_label VARCHAR(100) NOT NULL DEFAULT 'SALOM /',
  hero_image TEXT NOT NULL DEFAULT '/images/photo.jpg',
  hero_bio TEXT NOT NULL DEFAULT 'Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.',
  
  -- 2. Jarayon (Process Grid)
  process_text TEXT NOT NULL DEFAULT 'Foydalanuvchi muammosidan boshlab, dizayn va texnik yechimlargacha bo''lgan jarayon. Har bir qaror real ehtiyoj va aniq natijaga asoslanadi.',
  process_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- 3. Portfolio bo'limi pastki tugmasi
  portfolio_btn_title VARCHAR(100) NOT NULL DEFAULT 'Barcha loyihalar',
  portfolio_btn_category VARCHAR(100) NOT NULL DEFAULT 'Portfolio arxivi',
  portfolio_btn_year VARCHAR(50) NOT NULL DEFAULT 'Arxiv',
  
  -- 4. Yo'nalishlar banneri va marquee rasmlari
  directions_marquee_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  editorial_image_left TEXT NOT NULL DEFAULT '/images/process3.jpg',
  editorial_image_tall TEXT NOT NULL DEFAULT '/images/process1.jpg',
  editorial_image_short1 TEXT NOT NULL DEFAULT '/images/photo.jpg',
  editorial_image_short2 TEXT NOT NULL DEFAULT '/images/process2.jpg',
  directions_statement TEXT NOT NULL DEFAULT 'Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.',
  directions_label VARCHAR(100) NOT NULL DEFAULT 'ASOSIY YO‘NALISHLAR /',
  
  -- 5. Brendlar sarlavhasi
  brands_label VARCHAR(100) NOT NULL DEFAULT 'MEN ISHLAGAN BRENDLAR /',
  
  -- 6. Footer
  footer_label VARCHAR(100) NOT NULL DEFAULT 'Xullas /',
  footer_statement TEXT NOT NULL DEFAULT 'Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE home_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public home_settings read access" 
  ON home_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated admin full access on home_settings" 
  ON home_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Mavjud jadvalga yangi ustunlarni qo'shish (agar jadval avval yaratilgan bo'lsa)
ALTER TABLE home_settings 
ADD COLUMN IF NOT EXISTS portfolio_btn_title VARCHAR(100) DEFAULT 'Barcha loyihalar',
ADD COLUMN IF NOT EXISTS portfolio_btn_category VARCHAR(100) DEFAULT 'Portfolio arxivi',
ADD COLUMN IF NOT EXISTS portfolio_btn_year VARCHAR(50) DEFAULT 'Arxiv',
ADD COLUMN IF NOT EXISTS directions_marquee_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS editorial_image_left TEXT DEFAULT '/images/process3.jpg',
ADD COLUMN IF NOT EXISTS editorial_image_tall TEXT DEFAULT '/images/process1.jpg',
ADD COLUMN IF NOT EXISTS editorial_image_short1 TEXT DEFAULT '/images/photo.jpg',
ADD COLUMN IF NOT EXISTS editorial_image_short2 TEXT DEFAULT '/images/process2.jpg',
ADD COLUMN IF NOT EXISTS directions_statement TEXT DEFAULT 'Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.',
ADD COLUMN IF NOT EXISTS directions_label VARCHAR(100) DEFAULT 'ASOSIY YO‘NALISHLAR /',
ADD COLUMN IF NOT EXISTS brands_label VARCHAR(100) DEFAULT 'MEN ISHLAGAN BRENDLAR /';

-- Standart boshlang'ich qatorni kiritish yoki yangilash
INSERT INTO home_settings (
  id, 
  process_images, 
  directions_marquee_images
)
VALUES (
  'default',
  json_build_array('/images/process1.jpg', '/images/process2.jpg', '/images/process3.jpg')::jsonb,
  json_build_array('/images/process1.jpg', '/images/process2.jpg', '/images/process3.jpg', '/images/photo.jpg')::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  portfolio_btn_title = COALESCE(home_settings.portfolio_btn_title, 'Barcha loyihalar'),
  portfolio_btn_category = COALESCE(home_settings.portfolio_btn_category, 'Portfolio arxivi'),
  portfolio_btn_year = COALESCE(home_settings.portfolio_btn_year, 'Arxiv'),
  editorial_image_left = COALESCE(home_settings.editorial_image_left, '/images/process3.jpg'),
  editorial_image_tall = COALESCE(home_settings.editorial_image_tall, '/images/process1.jpg'),
  editorial_image_short1 = COALESCE(home_settings.editorial_image_short1, '/images/photo.jpg'),
  editorial_image_short2 = COALESCE(home_settings.editorial_image_short2, '/images/process2.jpg'),
  directions_statement = COALESCE(home_settings.directions_statement, 'Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.'),
  directions_label = COALESCE(home_settings.directions_label, 'ASOSIY YO‘NALISHLAR /'),
  brands_label = COALESCE(home_settings.brands_label, 'MEN ISHLAGAN BRENDLAR /');


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

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public brands read access" 
  ON brands FOR SELECT USING (true);

CREATE POLICY "Authenticated admin full access on brands" 
  ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Boshlang'ich 12 ta brendni kiritish
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
