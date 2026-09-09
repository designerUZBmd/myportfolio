"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AboutSection, AboutCareer, AboutFloatingCard } from "@/types/database";
import { parseAboutText, RenderAboutTokens } from "@/lib/aboutParser";
import "@/app/(public)/about/about.css";

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

const SECTION_TITLES = [
  "1-Bo‘lim: Kirish va Tanishtiruv",
  "2-Bo‘lim: Bank va Ekotizimlar",
  "3-Bo‘lim: 3D Modellashtirish va CGI",
  "4-Bo‘lim: Cannes Lions va Xalqaro E'tirof",
  "5-Bo‘lim: Falsafa va Mukammallik",
];

export default function AdminAboutPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [sections, setSections] = useState<AboutSection[]>(DEFAULT_SECTIONS);
  const [careerList, setCareerList] = useState<AboutCareer[]>(DEFAULT_CAREER_LIST);
  const [resumeUrl, setResumeUrl] = useState("/resume/Obloqulov%20Muhammad.pdf");
  const [resumeFilename, setResumeFilename] = useState("Obloqulov_Muhammad_Resume.pdf");
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/obloqulo_v");
  const [telegramHandle, setTelegramHandle] = useState("@obloqulo_v");
  const [email, setEmail] = useState("muhammad1obloqulov@gmail.com");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Media uploading states
  const [uploadingInline, setUploadingInline] = useState<boolean>(false);
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState<boolean>(false);

  // Yangi ish tajribasi qo'shish uchun form state
  const [newYear, setNewYear] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const { data, error } = await supabase
          .from("about_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (error) {
          console.warn("About sozlamalarini olishda xatolik:", error.message);
        } else if (data) {
          if (Array.isArray(data.sections) && data.sections.length >= 5) {
            setSections(data.sections);
          }
          if (Array.isArray(data.career_list) && data.career_list.length > 0) {
            setCareerList(data.career_list);
          }
          if (data.resume_url) setResumeUrl(data.resume_url);
          if (data.resume_filename) setResumeFilename(data.resume_filename);
          if (data.telegram_url) setTelegramUrl(data.telegram_url);
          if (data.telegram_handle) setTelegramHandle(data.telegram_handle);
          if (data.email) setEmail(data.email);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cloudinary upload helper
  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Faylni yuklashda xatolik yuz berdi");
    }

    const data = await res.json();
    return data.url;
  }

  // Saqlash
  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const { error } = await supabase.from("about_settings").upsert({
        id: "default",
        sections,
        career_list: careerList,
        resume_url: resumeUrl,
        resume_filename: resumeFilename,
        telegram_url: telegramUrl,
        telegram_handle: telegramHandle,
        email,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Saqlashda xatolik:", err);
      setErrorMessage(err?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  // Section matnini o'zgartirish
  function updateSectionText(idx: number, newText: string) {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], text: newText };
    setSections(updated);
  }

  // Textarea ichiga BOLD kiritish
  function insertBold(idx: number) {
    const textarea = textareaRefs.current[idx];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = sections[idx]?.text || "";
    const selected = currentText.substring(start, end);

    const replacement = selected ? `**${selected}**` : `**qalin matn**`;
    const nextText =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    updateSectionText(idx, nextText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  }

  // Textarea ichiga BADGE kiritish
  function insertBadge(idx: number) {
    const textarea = textareaRefs.current[idx];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = sections[idx]?.text || "";

    const replacement = ` [badge: ★ Cannes Young Lions '22] `;
    const nextText =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    updateSectionText(idx, nextText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  }

  // Textarea ichiga inline rasm yuklab joylashtirish
  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    setErrorMessage(null);
    try {
      const url = await uploadFile(file);
      const textarea = textareaRefs.current[activeTab];
      const currentText = sections[activeTab]?.text || "";

      let start = currentText.length;
      let end = currentText.length;
      if (textarea) {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
      }

      const replacement = ` [img: ${url}] `;
      const nextText =
        currentText.substring(0, start) + replacement + currentText.substring(end);

      updateSectionText(activeTab, nextText);
    } catch (err: any) {
      setErrorMessage(err?.message || "Inline rasmni yuklashda xatolik");
    } finally {
      setUploadingInline(false);
      if (e.target) e.target.value = "";
    }
  }

  // Chetdagi suzuvchi rasm kartasini yangilash
  async function handleSlotImageUpload(
    sectionIdx: number,
    cardId: string,
    file: File
  ) {
    setUploadingSlotId(cardId);
    setErrorMessage(null);
    try {
      const url = await uploadFile(file);
      const updated = [...sections];
      const currentCards = updated[sectionIdx].floating_cards || [];
      updated[sectionIdx].floating_cards = currentCards.map((c) =>
        c.id === cardId ? { ...c, image_url: url } : c
      );
      setSections(updated);
    } catch (err: any) {
      setErrorMessage(err?.message || "Rasmni yuklashda xatolik");
    } finally {
      setUploadingSlotId(null);
    }
  }

  // Chetdagi suzuvchi rasmni tozalash (placeholder holatiga qaytarish)
  function handleClearSlotImage(sectionIdx: number, cardId: string) {
    const updated = [...sections];
    const currentCards = updated[sectionIdx].floating_cards || [];
    updated[sectionIdx].floating_cards = currentCards.map((c) =>
      c.id === cardId ? { ...c, image_url: "" } : c
    );
    setSections(updated);
  }

  // Chetdagi suzuvchi rasm title/numberini yangilash
  function handleUpdateSlotMeta(
    sectionIdx: number,
    cardId: string,
    field: "number" | "title",
    value: string
  ) {
    const updated = [...sections];
    const currentCards = updated[sectionIdx].floating_cards || [];
    updated[sectionIdx].floating_cards = currentCards.map((c) =>
      c.id === cardId ? { ...c, [field]: value } : c
    );
    setSections(updated);
  }

  // CV / Resume faylini yuklash
  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setErrorMessage(null);
    try {
      const url = await uploadFile(file);
      setResumeUrl(url);
      setResumeFilename(file.name);
    } catch (err: any) {
      setErrorMessage(err?.message || "Resume faylini yuklashda xatolik");
    } finally {
      setUploadingResume(false);
      if (e.target) e.target.value = "";
    }
  }

  // Ish tajribasi qo'shish
  function handleAddCareer() {
    if (!newYear.trim() || !newCompany.trim() || !newRole.trim()) {
      alert("Iltimos, Yil, Kompaniya va Lavozim maydonlarini to‘liq to‘ldiring");
      return;
    }
    const newItem: AboutCareer = {
      year: newYear.trim(),
      company: newCompany.trim(),
      role: newRole.trim(),
    };
    setCareerList([newItem, ...careerList]);
    setNewYear("");
    setNewCompany("");
    setNewRole("");
  }

  // Ish tajribasini o'chirish
  function handleDeleteCareer(idx: number) {
    if (confirm("Ushbu ish tajribasini o‘chirmoqchimisiz?")) {
      setCareerList(careerList.filter((_, i) => i !== idx));
    }
  }

  // Ish tajribasi tartibini o'zgartirish
  function handleMoveCareer(idx: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= careerList.length) return;
    const updated = [...careerList];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCareerList(updated);
  }

  if (loading) {
    return (
      <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--adm-text-muted)" }}>
        Yuklanmoqda...
      </div>
    );
  }

  const currentSection = sections[activeTab];

  return (
    <div style={{ paddingBottom: "5rem" }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">About Sahifasi Boshqaruvi</h1>
          <p className="admin-page-subtitle">
            5 ta section matnlari, qalin so‘zlar, inline rasmlar, chetdagi suzuvchi kartalar va ish tajribasini tahrirlang.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-btn admin-btn--primary"
        >
          {saving ? "Saqlanmoqda..." : "O‘zgarishlarni Saqlash"}
        </button>
      </div>

      {/* Xabarnomalar */}
      {saveSuccess && (
        <div
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            backgroundColor: "#000000",
            color: "#ffffff",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✓ Barcha o‘zgarishlar muvaffaqiyatli saqlandi! Saytga tashrif buyurib ko‘rishingiz mumkin.</span>
          <a
            href="/about"
            target="_blank"
            style={{ color: "#82d9ff", textDecoration: "underline", marginLeft: "1rem" }}
          >
            About sahifasini ko‘rish ↗
          </a>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--adm-surface-border)",
          marginBottom: "2rem",
          overflowX: "auto",
          gap: "0.5rem",
        }}
      >
        {SECTION_TITLES.map((title, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              padding: "0.85rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === idx ? "2px solid #000000" : "2px solid transparent",
              color: activeTab === idx ? "#000000" : "var(--adm-text-secondary)",
              fontWeight: activeTab === idx ? 700 : 500,
              fontSize: "0.82rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            {title}
          </button>
        ))}

        <button
          onClick={() => setActiveTab(5)}
          style={{
            padding: "0.85rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === 5 ? "2px solid #000000" : "2px solid transparent",
            color: activeTab === 5 ? "#000000" : "var(--adm-text-secondary)",
            fontWeight: activeTab === 5 ? 700 : 500,
            fontSize: "0.82rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            transition: "all 0.15s ease",
          }}
        >
          6. Ish Tajribasi & CV
        </button>
      </div>

      {/* TAB 0 - 4: 5 TA ASOSIY SECTION */}
      {activeTab >= 0 && activeTab <= 4 && currentSection && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 1. Matn tahrirlash bloki */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  {SECTION_TITLES[activeTab]} — Matn va Inline Media
                </h2>
                <span className="admin-form-helper">
                  Matndagi so‘zlarni qalin qilish uchun <b>**qalin matn**</b>, matn orasiga rasm qo‘yish uchun <b>[img: URL]</b> tokenlaridan foydalaning.
                </span>
              </div>

              {/* Asboblar paneli (Toolbar) */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => insertBold(activeTab)}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  title="Belgilangan so'zni qalin (Bold) qilish"
                >
                  <b>B</b> Qalin (Bold)
                </button>

                <button
                  type="button"
                  onClick={() => inlineFileInputRef.current?.click()}
                  disabled={uploadingInline}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  title="Matn orasiga rasm yuklab joylashtirish"
                >
                  {uploadingInline ? "Yuklanmoqda..." : "🖼️ Matn orasiga rasm"}
                </button>

                <button
                  type="button"
                  onClick={() => insertBadge(activeTab)}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  title="Cannes yoki boshqa nishon qo'yish"
                >
                  ★ Nishon (Badge)
                </button>

                <input
                  ref={inlineFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleInlineImageUpload}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginBottom: "1rem" }}>
              <textarea
                ref={(el) => {
                  textareaRefs.current[activeTab] = el;
                }}
                rows={5}
                className="admin-textarea"
                value={currentSection.text || ""}
                onChange={(e) => updateSectionText(activeTab, e.target.value)}
                placeholder="Bo'lim matnini kiriting..."
                style={{ fontSize: "0.95rem", lineHeight: "1.6" }}
              />
            </div>

            {/* JONLI KO'RINISh (LIVE PREVIEW) */}
            <div style={{ marginTop: "1.5rem" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--adm-text-muted)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>Jonli Ko‘rinish (Live Preview):</span>
              </div>

              <div
                style={{
                  padding: "2rem 1.5rem",
                  background: "linear-gradient(180deg, #96dfff 0%, #c4eeff 50%, #f5fcff 100%)",
                  borderRadius: "0",
                  border: "1px solid rgba(0,0,0,0.08)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)",
                    lineHeight: 1.6,
                    fontWeight: 500,
                    color: "#000000",
                    maxWidth: "850px",
                    margin: "0 auto",
                  }}
                >
                  <RenderAboutTokens
                    tokens={parseAboutText(currentSection.text || "")}
                    chunkIndex={activeTab}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Chetdagi suzuvchi rasmlar (Floating Parallax Cards) */}
          <div className="admin-card">
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Chetdagi Suzuvchi Rasmlar (Floating Cards — {currentSection.floating_cards?.length || 0} ta)
              </h2>
              <p className="admin-form-helper">
                Ushbu bo‘lim atrofida suzuvchi parallax kartalari. Rasm yuklasangiz rasm ko‘rinadi, rasm yuklamasangiz stilize qilingan raqamli placeholder turadi.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {currentSection.floating_cards?.map((card, cIdx) => {
                const isUploading = uploadingSlotId === card.id;

                return (
                  <div
                    key={card.id || cIdx}
                    style={{
                      border: "1px solid var(--adm-surface-border)",
                      padding: "1.25rem",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem",
                    }}
                  >
                    {/* Yuqori qism: Slot ID & Number */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="admin-badge admin-badge--accent">
                        Slot: {card.id}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--adm-text-muted)" }}>№:</span>
                        <input
                          type="text"
                          value={card.number || ""}
                          onChange={(e) =>
                            handleUpdateSlotMeta(activeTab, card.id, "number", e.target.value)
                          }
                          className="admin-input"
                          style={{ width: "60px", padding: "0.25rem 0.5rem", fontSize: "0.8rem", textAlign: "center" }}
                        />
                      </div>
                    </div>

                    {/* Sarlavha (Title) */}
                    <div className="admin-form-group" style={{ marginBottom: "0.25rem" }}>
                      <label className="admin-form-label" style={{ fontSize: "0.7rem" }}>
                        Karta Sarlavhasi (Title):
                      </label>
                      <input
                        type="text"
                        value={card.title || ""}
                        onChange={(e) =>
                          handleUpdateSlotMeta(activeTab, card.id, "title", e.target.value)
                        }
                        className="admin-input"
                        style={{ padding: "0.45rem 0.65rem", fontSize: "0.82rem" }}
                        placeholder="Masalan: Portrait / Craft"
                      />
                    </div>

                    {/* Visual Preview */}
                    <div
                      style={{
                        width: "100%",
                        height: "160px",
                        position: "relative",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid var(--adm-surface-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {card.image_url ? (
                        <Image
                          src={card.image_url}
                          alt={card.title || card.number}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="280px"
                        />
                      ) : (
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)" }}>
                            {card.number || "00"}
                          </div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>
                            {card.title || "Placeholder"}
                          </div>
                          <span style={{ fontSize: "0.68rem", color: "var(--adm-text-muted)", marginTop: "0.25rem", display: "block" }}>
                            (Rasm yuklanmagan)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rasm boshqaruvi */}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <label
                        className={`admin-btn admin-btn--secondary admin-btn--sm ${isUploading ? "disabled" : ""}`}
                        style={{ flex: 1, cursor: isUploading ? "wait" : "pointer", textAlign: "center" }}
                      >
                        {isUploading ? "Yuklanmoqda..." : card.image_url ? "Rasmni almashtirish" : "Rasm yuklash"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSlotImageUpload(activeTab, card.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {card.image_url && (
                        <button
                          type="button"
                          onClick={() => handleClearSlotImage(activeTab, card.id)}
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          title="Rasmni olib tashlab, placeholderga qaytarish"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ISH TAJRIBASI VA CV */}
      {activeTab === 5 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 1. Ish Tajribasi (Career Timeline) */}
          <div className="admin-card">
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Ish Tajribasi Ro‘yxati (Career Timeline)
              </h2>
              <p className="admin-form-helper">
                About sahifasi pastida chiqadigan ish tajribasi yillari, kompaniyalari va lavozimlari.
              </p>
            </div>

            {/* Yangi ish joyi qo'shish formasi */}
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "#fafafa",
                border: "1px solid var(--adm-surface-border)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.85rem" }}>
                + Yangi Ish Joyi Qo‘shish
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  alignItems: "flex-end",
                }}
              >
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">Yil (Yillar):</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Masalan: 2025 — 2026"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">Kompaniya nomi:</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Masalan: KDB Bank Uzbekistan"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">Lavozim:</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Masalan: UX/UI Designer"
                    className="admin-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCareer}
                  className="admin-btn admin-btn--primary"
                  style={{ height: "42px" }}
                >
                  Qo‘shish
                </button>
              </div>
            </div>

            {/* Mavjud ish joylari jadvali */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "160px" }}>Yil</th>
                    <th>Kompaniya</th>
                    <th>Lavozim</th>
                    <th style={{ width: "180px", textAlign: "right" }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {careerList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.year}</td>
                      <td>{item.company}</td>
                      <td style={{ color: "var(--adm-text-secondary)" }}>{item.role}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => handleMoveCareer(idx, "up")}
                            disabled={idx === 0}
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            title="Tepaga siljitish"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCareer(idx, "down")}
                            disabled={idx === careerList.length - 1}
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            title="Pastga siljitish"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCareer(idx)}
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            title="O‘chirish"
                          >
                            O‘chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {careerList.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--adm-text-muted)", padding: "2rem" }}>
                        Hech qanday ish tajribasi kiritilmagan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Resume (CV) va Aloqa havolalari */}
          <div className="admin-card">
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Resume (CV PDF) va Aloqa Havolalari
              </h2>
              <p className="admin-form-helper">
                Foydalanuvchilar yuklab oladigan PDF rezyume va Telegram/Email havolalari.
              </p>
            </div>

            <div className="admin-form-row" style={{ marginBottom: "1.25rem" }}>
              {/* Resume File URL */}
              <div className="admin-form-group">
                <label className="admin-form-label">Resume PDF Fayli:</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="admin-input"
                    placeholder="/resume/Obloqulov Muhammad.pdf"
                  />
                  <label
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    style={{ whiteSpace: "nowrap", cursor: uploadingResume ? "wait" : "pointer" }}
                  >
                    {uploadingResume ? "Yuklanmoqda..." : "PDF Yuklash"}
                    <input
                      ref={resumeFileInputRef}
                      type="file"
                      accept=".pdf"
                      style={{ display: "none" }}
                      disabled={uploadingResume}
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Resume Filename */}
              <div className="admin-form-group">
                <label className="admin-form-label">Yuklab olinadigan fayl nomi:</label>
                <input
                  type="text"
                  value={resumeFilename}
                  onChange={(e) => setResumeFilename(e.target.value)}
                  className="admin-input"
                  placeholder="Obloqulov_Muhammad_Resume.pdf"
                />
              </div>
            </div>

            <div className="admin-form-row">
              {/* Telegram link & handle */}
              <div className="admin-form-group">
                <label className="admin-form-label">Telegram URL:</label>
                <input
                  type="text"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="admin-input"
                  placeholder="https://t.me/obloqulo_v"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Telegram Display Handle:</label>
                <input
                  type="text"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  className="admin-input"
                  placeholder="@obloqulo_v"
                />
              </div>

              {/* Email */}
              <div className="admin-form-group">
                <label className="admin-form-label">Email Manzili:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-input"
                  placeholder="muhammad1obloqulov@gmail.com"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pastki saqlash paneli */}
      <div
        style={{
          marginTop: "2.5rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-btn admin-btn--primary"
        >
          {saving ? "Saqlanmoqda..." : "Barcha O‘zgarishlarni Saqlash"}
        </button>
      </div>
    </div>
  );
}
