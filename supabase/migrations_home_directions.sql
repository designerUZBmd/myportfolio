-- ==============================================================================
-- 1. DIRECTIONS (YO'NALISHLAR) JADVALI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL DEFAULT '01',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) yoqish
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;

-- Hamkor/Tashrif buyuruvchilar uchun faqat o'qish (SELECT)
CREATE POLICY "Public directions read access" 
  ON directions FOR SELECT 
  USING (true);

-- Autentifikatsiyadan o'tgan adminlar uchun barcha amallar (ALL)
CREATE POLICY "Authenticated admin full access on directions" 
  ON directions FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Boshlang'ich (default) 4 ta yo'nalishni kiritish (agar bo'sh bo'lsa)
INSERT INTO directions (number, title, description, image, "order", is_active)
SELECT '01', 'UX/UI Dizayn', 'Foydalanuvchi tadqiqotlari, axborot arxitekturasi, wireframe va yuqori aniqlikdagi interaktiv prototiplar yaratish.', '/images/process1.jpg', 1, true
WHERE NOT EXISTS (SELECT 1 FROM directions WHERE title = 'UX/UI Dizayn');

INSERT INTO directions (number, title, description, image, "order", is_active)
SELECT '02', 'Web & Mobile Tajriba', 'Murakkab veb-platformalar, SaaS mahsulotlar va iOS / Android mobil ilovalari uchun intuitiv interfeyslar.', '/images/process2.jpg', 2, true
WHERE NOT EXISTS (SELECT 1 FROM directions WHERE title = 'Web & Mobile Tajriba');

INSERT INTO directions (number, title, description, image, "order", is_active)
SELECT '03', '3D & Motion Dizayn', 'Raqamli mahsulotlarni jonlantiruvchi 3D vizuallar, interaktiv animatsiyalar va brend estetikasi.', '/images/process3.jpg', 3, true
WHERE NOT EXISTS (SELECT 1 FROM directions WHERE title = '3D & Motion Dizayn');

INSERT INTO directions (number, title, description, image, "order", is_active)
SELECT '04', 'Dizayn Tizimlari', 'Katta jamoalar uchun kengaytiriladigan, moslashuvchan UI Kitlar, dizayn tokenlari va komponentlar kutubxonasi.', '/images/photo.jpg', 4, true
WHERE NOT EXISTS (SELECT 1 FROM directions WHERE title = 'Dizayn Tizimlari');


-- ==============================================================================
-- 2. HOME_SETTINGS (BOSH SAHIFA UMUMIY SOZLAMALARI) JADVALI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS home_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  hero_label VARCHAR(100) NOT NULL DEFAULT 'SALOM /',
  hero_image TEXT NOT NULL DEFAULT '/images/photo.jpg',
  hero_bio TEXT NOT NULL DEFAULT 'Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.',
  process_text TEXT NOT NULL DEFAULT 'Foydalanuvchi muammosidan boshlab, dizayn va texnik yechimlargacha bo''lgan jarayon. Har bir qaror real ehtiyoj va aniq natijaga asoslanadi.',
  process_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_label VARCHAR(100) NOT NULL DEFAULT 'Xullas /',
  footer_statement TEXT NOT NULL DEFAULT 'Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) yoqish
ALTER TABLE home_settings ENABLE ROW LEVEL SECURITY;

-- Hamkor/Tashrif buyuruvchilar uchun faqat o'qish (SELECT)
CREATE POLICY "Public home_settings read access" 
  ON home_settings FOR SELECT 
  USING (true);

-- Autentifikatsiyadan o'tgan adminlar uchun to'liq huquq (ALL)
CREATE POLICY "Authenticated admin full access on home_settings" 
  ON home_settings FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Boshlang'ich standart qatorni kiritish (agar bo'lmasa)
INSERT INTO home_settings (id, process_images)
VALUES (
  'default',
  json_build_array('/images/process1.jpg', '/images/process2.jpg', '/images/process3.jpg')::jsonb
)
ON CONFLICT (id) DO NOTHING;

