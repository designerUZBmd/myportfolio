import AboutClient from "./AboutClient";
import { supabase } from "@/lib/supabase";
import { AboutSettings, AboutSection, AboutCareer } from "@/types/database";

// Dinamik yuklanish: har bir yangilanish darhol aks etishi uchun
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_SECTIONS: AboutSection[] = [
  {
    id: 0,
    text: "Salom. Men **Muhammad Obloqulov** [img: /images/photo.jpg] — raqamli mahsulotlar va 3D tajribalarni loyihalashtiruvchi dizaynerman. Mening yo‘lim 2018-yilda, ilk bor interfeyslar va inson tajribasiga qiziqib qolganimda boshlangan.",
    floating_cards: [
      { id: "intro-1", number: "01", title: "Portrait / Craft", image_url: "" },
      { id: "intro-2", number: "02", title: "Studio / Process", image_url: "" },
      { id: "intro-3", number: "03", title: "Concept / 3D", image_url: "" },
    ],
  },
  {
    id: 1,
    text: "Dastlab oddiy veb-sahifalardan boshlab, yillar davomida murakkab korporativ ekotizimlargacha bo‘lgan yo‘lni bosib o‘tdim. Har kuni minglab insonlar va soha mutaxassislari foydalanadigan **bank ilovalari, ichki boshqaruv vositalari** hamda **internet-banking tizimlarini** loyihalashtirdim.",
    floating_cards: [
      { id: "bank-1", number: "04", title: "Fintech Mobile App", image_url: "" },
      { id: "bank-2", number: "05", title: "Banking Dashboard", image_url: "" },
      { id: "bank-3", number: "06", title: "Design System", image_url: "" },
    ],
  },
  {
    id: 2,
    text: "Lekin men uchun dizayn faqat 2D ekranlar bilan cheklanmaydi. Men mahsulotlarni **3D modellashtirish, fazoviy chuqurlik va vizualizatsiyani** yaxshi ko‘raman. [img: /images/process2.jpg] Logistika kompaniyalarining murakkab tizimlari va veb-saytlarini jonlantirishda 3D elementlardan faol foydalanaman.",
    floating_cards: [
      { id: "3d-1", number: "07", title: "3D Spatial Render", image_url: "" },
      { id: "3d-2", number: "08", title: "Product Visualization", image_url: "" },
      { id: "3d-3", number: "09", title: "CGI & Lighting", image_url: "" },
    ],
  },
  {
    id: 3,
    text: "2022-yilda ijodiy izlanishlarim xalqaro **Young Lions Cannes** festivali elektron sertifikati bilan e'tirof etildi. [badge: ★ Cannes Young Lions '22] Har bir loyihada estetikani funksionallik va biznes natijasi bilan muvozanatda ushlashga harakat qilaman.",
    floating_cards: [
      { id: "cannes-1", number: "10", title: "Cannes Lions Certificate", image_url: "" },
      { id: "cannes-2", number: "11", title: "Award-Winning Case", image_url: "" },
    ],
  },
  {
    id: 4,
    text: "Bugun men murakkab muammolarni **sodda, nafis va esda qolarli mahsulotlarga** aylantirishda davom etmoqdaman. Har bir piksel, har bir harakat va har bir tajriba — mukammallikka bo‘lgan intilishimdir.",
    floating_cards: [
      { id: "craft-1", number: "12", title: "Editorial Typography", image_url: "" },
      { id: "craft-2", number: "13", title: "Aesthetic Detail", image_url: "" },
    ],
  },
];

const DEFAULT_CAREER_LIST: AboutCareer[] = [
  { year: "2025 — 2026", company: "KDB Bank Uzbekistan", role: "UX/UI Designer" },
  { year: "2024 — 2025", company: "Unity ELD / NTP Freight", role: "Product & 3D Designer" },
  { year: "2023 — 2024", company: "BRO-STOREE (MacBro)", role: "Graphic, Web & Motion Designer" },
  { year: "2023", company: "Toshkent Davlat Iqtisodiyot Universiteti (TSUE)", role: "Full Stack Designer" },
  { year: "2021 — 2022", company: "Novas Studio", role: "UX/UI & 3D Designer" },
  { year: "2020 — 2021", company: "605 Creative Agency", role: "Brand Designer & Art Director" },
  { year: "2019 — 2020", company: "KDB Bank Uzbekistan", role: "UI/UX Web Designer" },
  { year: "2019 — 2020", company: "Silkroad Express", role: "SMM, UI/UX & Graphic Designer" },
  { year: "2018 — 2019", company: "YUZ1", role: "UI/UX Web Designer" },
];

const DEFAULT_SETTINGS: AboutSettings = {
  id: "default",
  sections: DEFAULT_SECTIONS,
  career_list: DEFAULT_CAREER_LIST,
  resume_url: "/resume/Obloqulov%20Muhammad.pdf",
  resume_filename: "Obloqulov_Muhammad_Resume.pdf",
  telegram_url: "https://t.me/obloqulo_v",
  telegram_handle: "@obloqulo_v",
  email: "muhammad1obloqulov@gmail.com",
};

export default async function AboutPage() {
  let settings: AboutSettings = DEFAULT_SETTINGS;

  try {
    const { data, error } = await supabase
      .from("about_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      settings = {
        id: data.id || "default",
        sections:
          Array.isArray(data.sections) && data.sections.length >= 5
            ? data.sections
            : DEFAULT_SECTIONS,
        career_list:
          Array.isArray(data.career_list) && data.career_list.length > 0
            ? data.career_list
            : DEFAULT_CAREER_LIST,
        resume_url: data.resume_url || DEFAULT_SETTINGS.resume_url,
        resume_filename: data.resume_filename || DEFAULT_SETTINGS.resume_filename,
        telegram_url: data.telegram_url || DEFAULT_SETTINGS.telegram_url,
        telegram_handle: data.telegram_handle || DEFAULT_SETTINGS.telegram_handle,
        email: data.email || DEFAULT_SETTINGS.email,
      };
    }
  } catch (err) {
    console.error("About sahifasi sozlamalarini serverda olishda xatolik:", err);
  }

  return <AboutClient settings={settings} />;
}
