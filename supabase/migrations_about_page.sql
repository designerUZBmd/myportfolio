-- ==============================================================================
-- ABOUT_SETTINGS JADVALI (ABOUT SAHIFASI BARCHA DINAMIK SOZLAMALARI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS about_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',

  -- 1. 5 ta asosiy bo'lim (matn, qalin so'zlar, inline rasmlar va chetdagi suzuvchi kartalar)
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 2. Ish tajribasi (yil, kompaniya, lavozim)
  career_list JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 3. Pastki qism: Resume va Aloqa
  resume_url TEXT NOT NULL DEFAULT '/resume/Obloqulov%20Muhammad.pdf',
  resume_filename TEXT NOT NULL DEFAULT 'Obloqulov_Muhammad_Resume.pdf',
  telegram_url TEXT NOT NULL DEFAULT 'https://t.me/obloqulo_v',
  telegram_handle TEXT NOT NULL DEFAULT '@obloqulo_v',
  email TEXT NOT NULL DEFAULT 'muhammad1obloqulov@gmail.com',

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE about_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public about_settings read access" 
  ON about_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated admin full access on about_settings" 
  ON about_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Boshlang'ich (default) ma'lumotlarni kiritish
INSERT INTO about_settings (
  id,
  sections,
  career_list,
  resume_url,
  resume_filename,
  telegram_url,
  telegram_handle,
  email
)
VALUES (
  'default',
  json_build_array(
    json_build_object(
      'id', 0,
      'text', 'Salom. Men **Muhammad Obloqulov** [img: /images/photo.jpg] — raqamli mahsulotlar va 3D tajribalarni loyihalashtiruvchi dizaynerman. Mening yo‘lim 2018-yilda, ilk bor interfeyslar va inson tajribasiga qiziqib qolganimda boshlangan.',
      'floating_cards', json_build_array(
        json_build_object('id', 'intro-1', 'number', '01', 'title', 'Portrait / Craft', 'image_url', ''),
        json_build_object('id', 'intro-2', 'number', '02', 'title', 'Studio / Process', 'image_url', ''),
        json_build_object('id', 'intro-3', 'number', '03', 'title', 'Concept / 3D', 'image_url', '')
      )
    ),
    json_build_object(
      'id', 1,
      'text', 'Dastlab oddiy veb-sahifalardan boshlab, yillar davomida murakkab korporativ ekotizimlargacha bo‘lgan yo‘lni bosib o‘tdim. Har kuni minglab insonlar va soha mutaxassislari foydalanadigan **bank ilovalari, ichki boshqaruv vositalari** hamda **internet-banking tizimlarini** loyihalashtirdim.',
      'floating_cards', json_build_array(
        json_build_object('id', 'bank-1', 'number', '04', 'title', 'Fintech Mobile App', 'image_url', ''),
        json_build_object('id', 'bank-2', 'number', '05', 'title', 'Banking Dashboard', 'image_url', ''),
        json_build_object('id', 'bank-3', 'number', '06', 'title', 'Design System', 'image_url', '')
      )
    ),
    json_build_object(
      'id', 2,
      'text', 'Lekin men uchun dizayn faqat 2D ekranlar bilan cheklanmaydi. Men mahsulotlarni **3D modellashtirish, fazoviy chuqurlik va vizualizatsiyani** yaxshi ko‘raman. [img: /images/process2.jpg] Logistika kompaniyalarining murakkab tizimlari va veb-saytlarini jonlantirishda 3D elementlardan faol foydalanaman.',
      'floating_cards', json_build_array(
        json_build_object('id', '3d-1', 'number', '07', 'title', '3D Spatial Render', 'image_url', ''),
        json_build_object('id', '3d-2', 'number', '08', 'title', 'Product Visualization', 'image_url', ''),
        json_build_object('id', '3d-3', 'number', '09', 'title', 'CGI & Lighting', 'image_url', '')
      )
    ),
    json_build_object(
      'id', 3,
      'text', '2022-yilda ijodiy izlanishlarim xalqaro **Young Lions Cannes** festivali elektron sertifikati bilan e''tirof etildi. [badge: ★ Cannes Young Lions ''22] Har bir loyihada estetikani funksionallik va biznes natijasi bilan muvozanatda ushlashga harakat qilaman.',
      'floating_cards', json_build_array(
        json_build_object('id', 'cannes-1', 'number', '10', 'title', 'Cannes Lions Certificate', 'image_url', ''),
        json_build_object('id', 'cannes-2', 'number', '11', 'title', 'Award-Winning Case', 'image_url', '')
      )
    ),
    json_build_object(
      'id', 4,
      'text', 'Bugun men murakkab muammolarni **sodda, nafis va esda qolarli mahsulotlarga** aylantirishda davom etmoqdaman. Har bir piksel, har bir harakat va har bir tajriba — mukammallikka bo‘lgan intilishimdir.',
      'floating_cards', json_build_array(
        json_build_object('id', 'craft-1', 'number', '12', 'title', 'Editorial Typography', 'image_url', ''),
        json_build_object('id', 'craft-2', 'number', '13', 'title', 'Aesthetic Detail', 'image_url', '')
      )
    )
  )::jsonb,
  json_build_array(
    json_build_object('year', '2025 — 2026', 'company', 'KDB Bank Uzbekistan', 'role', 'UX/UI Designer'),
    json_build_object('year', '2024 — 2025', 'company', 'Unity ELD / NTP Freight', 'role', 'Product & 3D Designer'),
    json_build_object('year', '2023 — 2024', 'company', 'BRO-STOREE (MacBro)', 'role', 'Graphic, Web & Motion Designer'),
    json_build_object('year', '2023', 'company', 'Toshkent Davlat Iqtisodiyot Universiteti (TSUE)', 'role', 'Full Stack Designer'),
    json_build_object('year', '2021 — 2022', 'company', 'Novas Studio', 'role', 'UX/UI & 3D Designer'),
    json_build_object('year', '2020 — 2021', 'company', '605 Creative Agency', 'role', 'Brand Designer & Art Director'),
    json_build_object('year', '2019 — 2020', 'company', 'KDB Bank Uzbekistan', 'role', 'UI/UX Web Designer'),
    json_build_object('year', '2019 — 2020', 'company', 'Silkroad Express', 'role', 'SMM, UI/UX & Graphic Designer'),
    json_build_object('year', '2018 — 2019', 'company', 'YUZ1', 'role', 'UI/UX Web Designer')
  )::jsonb,
  '/resume/Obloqulov%20Muhammad.pdf',
  'Obloqulov_Muhammad_Resume.pdf',
  'https://t.me/obloqulo_v',
  '@obloqulo_v',
  'muhammad1obloqulov@gmail.com'
)
ON CONFLICT (id) DO NOTHING;
