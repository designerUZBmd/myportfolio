"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { HomeSettings, Direction, Brand } from "@/types/database";

type TabType = "hero" | "directions" | "brands" | "footer";

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // 1. Hero & Process
  const [heroLabel, setHeroLabel] = useState("SALOM /");
  const [heroImage, setHeroImage] = useState("/images/photo.jpg");
  const [heroBio, setHeroBio] = useState(
    "Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman."
  );

  const [processText, setProcessText] = useState(
    "Foydalanuvchi muammosidan boshlab, dizayn va texnik yechimlargacha bo'lgan jarayon. Har bir qaror real ehtiyoj va aniq natijaga asoslanadi."
  );
  const [processImages, setProcessImages] = useState<string[]>([
    "/images/process1.jpg",
    "/images/process2.jpg",
    "/images/process3.jpg",
  ]);

  // 2. Portfolio Button
  const [portfolioBtnTitle, setPortfolioBtnTitle] = useState("Barcha loyihalar");
  const [portfolioBtnCategory, setPortfolioBtnCategory] = useState("Portfolio arxivi");
  const [portfolioBtnYear, setPortfolioBtnYear] = useState("Arxiv");

  // 3. Directions Banner & Marquee
  const [marqueeImages, setMarqueeImages] = useState<string[]>([
    "/images/process1.jpg",
    "/images/process2.jpg",
    "/images/process3.jpg",
    "/images/photo.jpg",
  ]);
  const [editorialLeft, setEditorialLeft] = useState("/images/process3.jpg");
  const [editorialTall, setEditorialTall] = useState("/images/process1.jpg");
  const [editorialShort1, setEditorialShort1] = useState("/images/photo.jpg");
  const [editorialShort2, setEditorialShort2] = useState("/images/process2.jpg");
  const [directionsStatement, setDirectionsStatement] = useState(
    "Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi."
  );
  const [directionsLabel, setDirectionsLabel] = useState("ASOSIY YO‘NALISHLAR /");

  // 4. Brands Label & Footer
  const [brandsLabel, setBrandsLabel] = useState("MEN ISHLAGAN BRENDLAR /");
  const [footerLabel, setFooterLabel] = useState("Xullas /");
  const [footerStatement, setFooterStatement] = useState(
    "Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman."
  );

  // Uploading flags
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProcessIndex, setUploadingProcessIndex] = useState<number | null>(null);
  const [uploadingMarquee, setUploadingMarquee] = useState(false);
  const [uploadingEditorial, setUploadingEditorial] = useState<string | null>(null);

  // Directions CRUD states
  const [directionsList, setDirectionsList] = useState<Direction[]>([]);
  const [editingDirectionId, setEditingDirectionId] = useState<string | null>(null);
  const [dirNumber, setDirNumber] = useState("01");
  const [dirTitle, setDirTitle] = useState("");
  const [dirDesc, setDirDesc] = useState("");
  const [dirImage, setDirImage] = useState("");
  const [dirOrder, setDirOrder] = useState(1);
  const [dirActive, setDirActive] = useState(true);
  const [uploadingDirImage, setUploadingDirImage] = useState(false);

  // Brands CRUD states
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandHeight, setBrandHeight] = useState(240);
  const [brandOrder, setBrandOrder] = useState(1);
  const [brandActive, setBrandActive] = useState(true);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);

  // Load all initial data
  async function loadAllData() {
    setLoading(true);
    setDbError(null);
    try {
      // 1. Settings
      const { data: sData } = await supabase
        .from("home_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (sData) {
        const s = sData as HomeSettings;
        if (s.hero_label) setHeroLabel(s.hero_label);
        if (s.hero_image) setHeroImage(s.hero_image);
        if (s.hero_bio) setHeroBio(s.hero_bio);
        if (s.process_text) setProcessText(s.process_text);
        if (Array.isArray(s.process_images) && s.process_images.length > 0) {
          setProcessImages(s.process_images);
        }
        if (s.portfolio_btn_title) setPortfolioBtnTitle(s.portfolio_btn_title);
        if (s.portfolio_btn_category) setPortfolioBtnCategory(s.portfolio_btn_category);
        if (s.portfolio_btn_year) setPortfolioBtnYear(s.portfolio_btn_year);
        if (Array.isArray(s.directions_marquee_images) && s.directions_marquee_images.length > 0) {
          setMarqueeImages(s.directions_marquee_images);
        }
        if (s.editorial_image_left) setEditorialLeft(s.editorial_image_left);
        if (s.editorial_image_tall) setEditorialTall(s.editorial_image_tall);
        if (s.editorial_image_short1) setEditorialShort1(s.editorial_image_short1);
        if (s.editorial_image_short2) setEditorialShort2(s.editorial_image_short2);
        if (s.directions_statement) setDirectionsStatement(s.directions_statement);
        if (s.directions_label) setDirectionsLabel(s.directions_label);
        if (s.brands_label !== undefined) setBrandsLabel(s.brands_label);
        if (s.footer_label) setFooterLabel(s.footer_label);
        if (s.footer_statement) setFooterStatement(s.footer_statement);
      }

      // 2. Directions
      const { data: dData } = await supabase
        .from("directions")
        .select("*")
        .order("order", { ascending: true });
      if (dData) setDirectionsList(dData);

      // 3. Brands
      const { data: bData } = await supabase
        .from("brands")
        .select("*")
        .order("order", { ascending: true });
      if (bData) setBrandsList(bData);
    } catch (err: any) {
      console.error("Load error:", err);
      setDbError(err?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // Generic Cloudinary upload helper
  async function uploadFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }

  // Save Home Settings
  async function handleSaveSettings() {
    setSaving(true);
    try {
      const payload = {
        id: "default",
        hero_label: heroLabel,
        hero_image: heroImage,
        hero_bio: heroBio,
        process_text: processText,
        process_images: processImages,
        portfolio_btn_title: portfolioBtnTitle,
        portfolio_btn_category: portfolioBtnCategory,
        portfolio_btn_year: portfolioBtnYear,
        directions_marquee_images: marqueeImages,
        editorial_image_left: editorialLeft,
        editorial_image_tall: editorialTall,
        editorial_image_short1: editorialShort1,
        editorial_image_short2: editorialShort2,
        directions_statement: directionsStatement,
        directions_label: directionsLabel,
        brands_label: brandsLabel,
        footer_label: footerLabel,
        footer_statement: footerStatement,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("home_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
      alert("Bosh sahifa sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Saqlashda xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------
  // DIRECTIONS CRUD
  // -------------------------------------------------------------
  function resetDirectionForm() {
    setEditingDirectionId(null);
    const nextOrder = directionsList.length > 0 ? Math.max(...directionsList.map((d) => d.order || 0)) + 1 : 1;
    setDirOrder(nextOrder);
    setDirNumber(String(nextOrder).padStart(2, "0"));
    setDirTitle("");
    setDirDesc("");
    setDirImage("");
    setDirActive(true);
  }

  function handleEditDirection(item: Direction) {
    setEditingDirectionId(item.id);
    setDirNumber(item.number);
    setDirTitle(item.title);
    setDirDesc(item.description);
    setDirImage(item.image);
    setDirOrder(item.order);
    setDirActive(item.is_active);
  }

  async function handleSaveDirection(e: React.FormEvent) {
    e.preventDefault();
    if (!dirTitle.trim() || !dirImage.trim()) {
      alert("Iltimos, sarlavha va rasmni kiriting!");
      return;
    }
    setSaving(true);
    try {
      if (editingDirectionId) {
        const { error } = await supabase
          .from("directions")
          .update({
            number: dirNumber,
            title: dirTitle,
            description: dirDesc,
            image: dirImage,
            order: Number(dirOrder),
            is_active: dirActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingDirectionId);
        if (error) throw error;
        alert("Yo‘nalish yangilandi!");
      } else {
        const { error } = await supabase.from("directions").insert([
          {
            number: dirNumber,
            title: dirTitle,
            description: dirDesc,
            image: dirImage,
            order: Number(dirOrder),
            is_active: dirActive,
          },
        ]);
        if (error) throw error;
        alert("Yangi yo‘nalish qo‘shildi!");
      }
      resetDirectionForm();
      const { data } = await supabase.from("directions").select("*").order("order");
      if (data) setDirectionsList(data);
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDirection(id: string, title: string) {
    if (!confirm(`"${title}" yo‘nalishini o‘chirishni tasdiqlaysizmi?`)) return;
    try {
      const { error } = await supabase.from("directions").delete().eq("id", id);
      if (error) throw error;
      setDirectionsList((prev) => prev.filter((d) => d.id !== id));
      if (editingDirectionId === id) resetDirectionForm();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    }
  }

  async function handleToggleDirectionStatus(item: Direction) {
    try {
      const updated = !item.is_active;
      const { error } = await supabase
        .from("directions")
        .update({ is_active: updated, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      setDirectionsList((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, is_active: updated } : d))
      );
    } catch (err) {
      alert("Holatni o‘zgartirishda xatolik");
    }
  }

  // -------------------------------------------------------------
  // BRANDS CRUD
  // -------------------------------------------------------------
  function resetBrandForm() {
    setEditingBrandId(null);
    setBrandName("");
    setBrandLogo("");
    setBrandHeight(240);
    const nextOrder = brandsList.length > 0 ? Math.max(...brandsList.map((b) => b.order || 0)) + 1 : 1;
    setBrandOrder(nextOrder);
    setBrandActive(true);
  }

  function handleEditBrand(item: Brand) {
    setEditingBrandId(item.id);
    setBrandName(item.name);
    setBrandLogo(item.logo_url || "");
    setBrandHeight(item.height || 240);
    setBrandOrder(item.order);
    setBrandActive(item.is_active);
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) {
      alert("Iltimos, brend nomini kiriting!");
      return;
    }
    setSaving(true);
    try {
      if (editingBrandId) {
        const { error } = await supabase
          .from("brands")
          .update({
            name: brandName,
            logo_url: brandLogo,
            height: Number(brandHeight),
            order: Number(brandOrder),
            is_active: brandActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBrandId);
        if (error) throw error;
        alert("Brend yangilandi!");
      } else {
        const { error } = await supabase.from("brands").insert([
          {
            name: brandName,
            logo_url: brandLogo,
            height: Number(brandHeight),
            order: Number(brandOrder),
            is_active: brandActive,
          },
        ]);
        if (error) throw error;
        alert("Yangi brend qo‘shildi!");
      }
      resetBrandForm();
      const { data } = await supabase.from("brands").select("*").order("order");
      if (data) setBrandsList(data);
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBrand(id: string, name: string) {
    if (!confirm(`"${name}" brendini o‘chirishni tasdiqlaysizmi?`)) return;
    try {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
      setBrandsList((prev) => prev.filter((b) => b.id !== id));
      if (editingBrandId === id) resetBrandForm();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    }
  }

  async function handleToggleBrandStatus(item: Brand) {
    try {
      const updated = !item.is_active;
      const { error } = await supabase
        .from("brands")
        .update({ is_active: updated, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      setBrandsList((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, is_active: updated } : b))
      );
    } catch (err) {
      alert("Holatni o‘zgartirishda xatolik");
    }
  }

  return (
    <div className="admin-content">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bosh Sahifa Boshqaruvi</h1>
          <p className="admin-page-subtitle">
            Bosh sahifadagi barcha matnlar, suratlar, yo‘nalishlar va brendlarni yagona markazdan boshqarish
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="admin-btn admin-btn--primary"
          style={{ minWidth: "220px", padding: "0.75rem 1.4rem" }}
        >
          {saving ? "Saqlanmoqda..." : "💾 Sozlamalarni Saqlash"}
        </button>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div
          style={{
            padding: "1.25rem",
            marginBottom: "2rem",
            border: "1px solid rgba(220, 38, 38, 0.4)",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>
            ⚠️ Supabase bazasida yangi jadvallar/ustunlar kutilmoqda
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
            Iltimos, Supabase SQL Editor bo‘limida <code>supabase/migrations_homepage_complete.sql</code> skriptini ishga tushiring.
          </p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--adm-surface-border)",
          paddingBottom: "0.75rem",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("hero")}
          className={`admin-btn ${activeTab === "hero" ? "admin-btn--primary" : "admin-btn--secondary"}`}
        >
          🌟 Hero & Jarayon
        </button>
        <button
          onClick={() => setActiveTab("directions")}
          className={`admin-btn ${activeTab === "directions" ? "admin-btn--primary" : "admin-btn--secondary"}`}
        >
          ⚡ Yo‘nalishlar & Marquee ({directionsList.length})
        </button>
        <button
          onClick={() => setActiveTab("brands")}
          className={`admin-btn ${activeTab === "brands" ? "admin-btn--primary" : "admin-btn--secondary"}`}
        >
          🏷 Brendlar & Hamkorlar ({brandsList.length})
        </button>
        <button
          onClick={() => setActiveTab("footer")}
          className={`admin-btn ${activeTab === "footer" ? "admin-btn--primary" : "admin-btn--secondary"}`}
        >
          📄 Footer
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--adm-text-muted)" }}>
          Yuklanmoqda...
        </div>
      ) : (
        <div>
          {/* ========================================================================= */}
          {/* TAB 1: HERO & JARAYON & PORTFOLIO TUGMASI                                 */}
          {/* ========================================================================= */}
          {activeTab === "hero" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* 1.1 Hero */}
              <div className="admin-card">
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                  1. Hero (Bosh qism)
                </h2>

                <div className="admin-form-row" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 2 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Tepa Belgisi / Prefiks</label>
                      <input
                        type="text"
                        value={heroLabel}
                        onChange={(e) => setHeroLabel(e.target.value)}
                        placeholder="SALOM /"
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Asosiy Surat (Photo)</label>
                      <input
                        type="text"
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        className="admin-input"
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ cursor: uploadingHero ? "not-allowed" : "pointer" }}>
                        {uploadingHero ? "Yuklanmoqda..." : "📁 Yangi Surat Yuklash"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setUploadingHero(true);
                            const url = await uploadFile(e.target.files[0]);
                            if (url) setHeroImage(url);
                            setUploadingHero(false);
                          }}
                          disabled={uploadingHero}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>

                  {heroImage && (
                    <div style={{ width: "140px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span className="admin-form-label">Surat Ko‘rinishi</span>
                      <div style={{ width: "140px", height: "185px", position: "relative", border: "1px solid #eee", overflow: "hidden" }}>
                        <Image src={heroImage} alt="Hero preview" fill style={{ objectFit: "cover" }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                  <label className="admin-form-label">Bio / O‘zingiz haqingizda matn (HeroBioText)</label>
                  <textarea
                    value={heroBio}
                    onChange={(e) => setHeroBio(e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </div>
              </div>

              {/* 1.2 Jarayon */}
              <div className="admin-card">
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                  2. Jarayon (Process Grid)
                </h2>

                <div className="admin-form-group">
                  <label className="admin-form-label">Jarayon Kirish Matni</label>
                  <textarea
                    value={processText}
                    onChange={(e) => setProcessText(e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ marginBottom: "0.75rem" }}>
                    3 ta Jarayon Kartasi Rasmlari
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} style={{ border: "1px solid #eee", padding: "1rem", backgroundColor: "#fafafa" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                          Rasm #{idx + 1}
                        </span>
                        <div style={{ width: "100%", height: "130px", position: "relative", marginBottom: "0.75rem", border: "1px solid #ddd", overflow: "hidden" }}>
                          <Image src={processImages[idx] || "/images/process1.jpg"} alt={`Process ${idx + 1}`} fill style={{ objectFit: "cover" }} />
                        </div>
                        <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ width: "100%", cursor: uploadingProcessIndex === idx ? "not-allowed" : "pointer" }}>
                          {uploadingProcessIndex === idx ? "Yuklanmoqda..." : "📁 Almashtirish"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (!e.target.files?.[0]) return;
                              setUploadingProcessIndex(idx);
                              const url = await uploadFile(e.target.files[0]);
                              if (url) {
                                setProcessImages((prev) => {
                                  const next = [...prev];
                                  next[idx] = url;
                                  return next;
                                });
                              }
                              setUploadingProcessIndex(null);
                            }}
                            disabled={uploadingProcessIndex === idx}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1.3 Portfolio Bo‘limi Tugmasi */}
              <div className="admin-card">
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                  3. Portfolio Ro‘yxati Oxiridagi Tugma Matnlari
                </h2>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Asosiy Matn (Title)</label>
                    <input
                      type="text"
                      value={portfolioBtnTitle}
                      onChange={(e) => setPortfolioBtnTitle(e.target.value)}
                      placeholder="Barcha loyihalar"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Kategoriya Yozuvi (Category)</label>
                    <input
                      type="text"
                      value={portfolioBtnCategory}
                      onChange={(e) => setPortfolioBtnCategory(e.target.value)}
                      placeholder="Portfolio arxivi"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Yil / O‘ng Yozuv (Year/Status)</label>
                    <input
                      type="text"
                      value={portfolioBtnYear}
                      onChange={(e) => setPortfolioBtnYear(e.target.value)}
                      placeholder="Arxiv"
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: YO‘NALISHLAR, MARQUEE & EDITORIAL BANNER                           */}
          {/* ========================================================================= */}
          {activeTab === "directions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* 2.1 Marquee Rasmlari */}
              <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Marquee Harakatlanuvchi Rasmlari ({marqueeImages.length})
                    </h2>
                    <span className="admin-form-helper">Yo‘nalishlar tepasida cheksiz aylanib turuvchi suratlar</span>
                  </div>

                  <label className="admin-btn admin-btn--primary admin-btn--sm" style={{ cursor: uploadingMarquee ? "not-allowed" : "pointer" }}>
                    {uploadingMarquee ? "Yuklanmoqda..." : "+ Yangi Marquee Rasm Yuklash"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        setUploadingMarquee(true);
                        const url = await uploadFile(e.target.files[0]);
                        if (url) {
                          setMarqueeImages((prev) => [...prev, url]);
                        }
                        setUploadingMarquee(false);
                      }}
                      disabled={uploadingMarquee}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                  {marqueeImages.map((imgSrc, i) => (
                    <div key={i} style={{ border: "1px solid #ddd", padding: "0.5rem", backgroundColor: "#fafafa", position: "relative" }}>
                      <div style={{ width: "100%", height: "85px", position: "relative", marginBottom: "0.5rem", overflow: "hidden" }}>
                        <Image src={imgSrc} alt={`Marquee ${i + 1}`} fill style={{ objectFit: "cover" }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Ushbu marquee rasmni ro‘yxatdan o‘chirmoqchimisiz?")) {
                            setMarqueeImages((prev) => prev.filter((_, idx) => idx !== i));
                          }
                        }}
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        style={{ width: "100%", padding: "0.25rem" }}
                      >
                        O‘chirish
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2.2 Editorial Banner 4 ta Surat va Bayonot */}
              <div className="admin-card">
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                  Editorial Banner (4 ta Asosiy Surat va Falsafa Matni)
                </h2>

                <div className="admin-form-group">
                  <label className="admin-form-label">&quot;Murakkab g‘oyalardan...&quot; Bayonoti (Scroll so‘zma-so‘z animatsiyasi)</label>
                  <textarea
                    value={directionsStatement}
                    onChange={(e) => setDirectionsStatement(e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginTop: "1.25rem" }}>
                  {/* Left image */}
                  <div style={{ border: "1px solid #eee", padding: "1rem", backgroundColor: "#fafafa" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                      Chapdagi Katta Surat (28vw)
                    </span>
                    <div style={{ width: "100%", height: "130px", position: "relative", marginBottom: "0.75rem", overflow: "hidden" }}>
                      <Image src={editorialLeft} alt="Editorial Left" fill style={{ objectFit: "cover" }} />
                    </div>
                    <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ width: "100%", cursor: "pointer" }}>
                      {uploadingEditorial === "left" ? "Yuklanmoqda..." : "📁 Almashtirish"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          setUploadingEditorial("left");
                          const url = await uploadFile(e.target.files[0]);
                          if (url) setEditorialLeft(url);
                          setUploadingEditorial(null);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {/* Tall image */}
                  <div style={{ border: "1px solid #eee", padding: "1rem", backgroundColor: "#fafafa" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                      1-Baland Surat (Tall)
                    </span>
                    <div style={{ width: "100%", height: "130px", position: "relative", marginBottom: "0.75rem", overflow: "hidden" }}>
                      <Image src={editorialTall} alt="Editorial Tall" fill style={{ objectFit: "cover" }} />
                    </div>
                    <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ width: "100%", cursor: "pointer" }}>
                      {uploadingEditorial === "tall" ? "Yuklanmoqda..." : "📁 Almashtirish"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          setUploadingEditorial("tall");
                          const url = await uploadFile(e.target.files[0]);
                          if (url) setEditorialTall(url);
                          setUploadingEditorial(null);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {/* Short 1 */}
                  <div style={{ border: "1px solid #eee", padding: "1rem", backgroundColor: "#fafafa" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                      2-Qisqa Surat (Short 1)
                    </span>
                    <div style={{ width: "100%", height: "130px", position: "relative", marginBottom: "0.75rem", overflow: "hidden" }}>
                      <Image src={editorialShort1} alt="Editorial Short 1" fill style={{ objectFit: "cover" }} />
                    </div>
                    <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ width: "100%", cursor: "pointer" }}>
                      {uploadingEditorial === "short1" ? "Yuklanmoqda..." : "📁 Almashtirish"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          setUploadingEditorial("short1");
                          const url = await uploadFile(e.target.files[0]);
                          if (url) setEditorialShort1(url);
                          setUploadingEditorial(null);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {/* Short 2 */}
                  <div style={{ border: "1px solid #eee", padding: "1rem", backgroundColor: "#fafafa" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                      3-Qisqa Surat (Short 2)
                    </span>
                    <div style={{ width: "100%", height: "130px", position: "relative", marginBottom: "0.75rem", overflow: "hidden" }}>
                      <Image src={editorialShort2} alt="Editorial Short 2" fill style={{ objectFit: "cover" }} />
                    </div>
                    <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ width: "100%", cursor: "pointer" }}>
                      {uploadingEditorial === "short2" ? "Yuklanmoqda..." : "📁 Almashtirish"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          setUploadingEditorial("short2");
                          const url = await uploadFile(e.target.files[0]);
                          if (url) setEditorialShort2(url);
                          setUploadingEditorial(null);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2.3 Yo‘nalishlar Ro‘yxati (CRUD) */}
              <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {editingDirectionId ? "Yo‘nalishni Tahrirlash" : "Yangi Yo‘nalish Qo‘shish"}
                  </h2>
                  {editingDirectionId && (
                    <button type="button" onClick={resetDirectionForm} className="admin-btn admin-btn--secondary admin-btn--sm">
                      Bekor qilish
                    </button>
                  )}
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="admin-form-label">Bo‘lim Sarlavhasi / Prefiksi</label>
                  <input
                    type="text"
                    value={directionsLabel}
                    onChange={(e) => setDirectionsLabel(e.target.value)}
                    placeholder="ASOSIY YO‘NALISHLAR /"
                    className="admin-input"
                  />
                </div>

                <form onSubmit={handleSaveDirection}>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Raqami (Number) *</label>
                      <input
                        type="text"
                        value={dirNumber}
                        onChange={(e) => setDirNumber(e.target.value)}
                        placeholder="masalan, 01"
                        required
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-form-group" style={{ flex: 2 }}>
                      <label className="admin-form-label">Sarlavhasi *</label>
                      <input
                        type="text"
                        value={dirTitle}
                        onChange={(e) => setDirTitle(e.target.value)}
                        placeholder="masalan, UX/UI Dizayn"
                        required
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Tartib</label>
                      <input
                        type="number"
                        value={dirOrder}
                        onChange={(e) => setDirOrder(Number(e.target.value))}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Tavsifi *</label>
                    <textarea
                      value={dirDesc}
                      onChange={(e) => setDirDesc(e.target.value)}
                      placeholder="Qisqa tavsif..."
                      rows={2}
                      required
                      className="admin-textarea"
                    />
                  </div>

                  <div className="admin-form-row" style={{ alignItems: "flex-start" }}>
                    <div className="admin-form-group" style={{ flex: 2 }}>
                      <label className="admin-form-label">Hover WebGL Rasmi *</label>
                      <input
                        type="text"
                        value={dirImage}
                        onChange={(e) => setDirImage(e.target.value)}
                        placeholder="https://... yoki /images/process1.jpg"
                        required
                        className="admin-input"
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ cursor: "pointer" }}>
                        {uploadingDirImage ? "Yuklanmoqda..." : "📁 Kompyuterdan Rasm Yuklash"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setUploadingDirImage(true);
                            const url = await uploadFile(e.target.files[0]);
                            if (url) setDirImage(url);
                            setUploadingDirImage(false);
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {dirImage && (
                      <div className="admin-form-group" style={{ width: "120px" }}>
                        <span className="admin-form-label">Prevyu</span>
                        <div style={{ width: "100px", height: "70px", position: "relative", border: "1px solid #ddd", overflow: "hidden" }}>
                          <Image src={dirImage} alt="Dir preview" fill style={{ objectFit: "cover" }} />
                        </div>
                      </div>
                    )}

                    <div className="admin-form-group" style={{ alignSelf: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={dirActive}
                          onChange={(e) => setDirActive(e.target.checked)}
                          style={{ width: "16px", height: "16px" }}
                        />
                        Faol (Saytda ko‘rinsin)
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                    {editingDirectionId && (
                      <button type="button" onClick={resetDirectionForm} className="admin-btn admin-btn--secondary">
                        Bekor qilish
                      </button>
                    )}
                    <button type="submit" disabled={saving || uploadingDirImage} className="admin-btn admin-btn--primary">
                      {editingDirectionId ? "Yo‘nalishni Yangilash" : "+ Yo‘nalish Qo‘shish"}
                    </button>
                  </div>
                </form>

                {/* Directions Table */}
                <div style={{ marginTop: "2rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", textTransform: "uppercase" }}>
                    Mavjud Yo‘nalishlar ({directionsList.length})
                  </h3>
                  {directionsList.length === 0 ? (
                    <p style={{ color: "var(--adm-text-muted)" }}>Hozircha birorta yo‘nalish kiritilmagan.</p>
                  ) : (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: "60px" }}>Raqam</th>
                            <th style={{ width: "70px" }}>Rasm</th>
                            <th>Sarlavha</th>
                            <th style={{ width: "70px", textAlign: "center" }}>Tartib</th>
                            <th style={{ width: "80px", textAlign: "center" }}>Holat</th>
                            <th style={{ width: "150px", textAlign: "right" }}>Amallar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {directionsList.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 700 }}>{item.number}</td>
                              <td>
                                <div style={{ width: "50px", height: "35px", position: "relative", border: "1px solid #ddd", overflow: "hidden" }}>
                                  <Image src={item.image} alt={item.title} fill style={{ objectFit: "cover" }} />
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.title}</td>
                              <td style={{ textAlign: "center" }}>{item.order}</td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDirectionStatus(item)}
                                  className={`admin-badge ${item.is_active ? "admin-badge--success" : "admin-badge--muted"}`}
                                  style={{ cursor: "pointer", border: "none" }}
                                >
                                  {item.is_active ? "Faol" : "Nofaol"}
                                </button>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditDirection(item)}
                                    className="admin-btn admin-btn--secondary admin-btn--sm"
                                  >
                                    Tahrirlash
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDirection(item.id, item.title)}
                                    className="admin-btn admin-btn--danger admin-btn--sm"
                                  >
                                    O‘chirish
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BRENDLAR & HAMKORLAR                                               */}
          {/* ========================================================================= */}
          {activeTab === "brands" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {editingBrandId ? "Brendni Tahrirlash" : "Yangi Brend Qo‘shish"}
                  </h2>
                  {editingBrandId && (
                    <button type="button" onClick={resetBrandForm} className="admin-btn admin-btn--secondary admin-btn--sm">
                      Bekor qilish
                    </button>
                  )}
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="admin-form-label">Bo‘lim Sarlavhasi / Prefiksi</label>
                  <input
                    type="text"
                    value={brandsLabel}
                    onChange={(e) => setBrandsLabel(e.target.value)}
                    placeholder="MEN ISHLAGAN BRENDLAR /"
                    className="admin-input"
                  />
                  <span className="admin-form-helper">Marquee tepasida chiqadigan sarlavha</span>
                </div>

                <form onSubmit={handleSaveBrand}>
                  <div className="admin-form-row">
                    <div className="admin-form-group" style={{ flex: 2 }}>
                      <label className="admin-form-label">Brend Nomi *</label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="masalan, PAYME yoki UZUM"
                        required
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Karta Balandligi (px)</label>
                      <input
                        type="number"
                        value={brandHeight}
                        onChange={(e) => setBrandHeight(Number(e.target.value))}
                        min={150}
                        max={400}
                        className="admin-input"
                      />
                      <span className="admin-form-helper">180px dan 340px gacha</span>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Tartib</label>
                      <input
                        type="number"
                        value={brandOrder}
                        onChange={(e) => setBrandOrder(Number(e.target.value))}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row" style={{ alignItems: "flex-start", marginTop: "0.5rem" }}>
                    <div className="admin-form-group" style={{ flex: 2 }}>
                      <label className="admin-form-label">Logotip Rasmi (PNG / SVG / WebP)</label>
                      <input
                        type="text"
                        value={brandLogo}
                        onChange={(e) => setBrandLogo(e.target.value)}
                        placeholder="https://... yoki bo‘sh qoldiring (standart logo/matn ko‘rinadi)"
                        className="admin-input"
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <label className="admin-btn admin-btn--secondary admin-btn--sm" style={{ cursor: "pointer" }}>
                        {uploadingBrandLogo ? "Yuklanmoqda..." : "📁 Kompyuterdan Logotip Yuklash"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setUploadingBrandLogo(true);
                            const url = await uploadFile(e.target.files[0]);
                            if (url) setBrandLogo(url);
                            setUploadingBrandLogo(false);
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {brandLogo && (
                      <div className="admin-form-group" style={{ width: "120px" }}>
                        <span className="admin-form-label">Prevyu</span>
                        <div style={{ width: "100px", height: "45px", position: "relative", border: "1px solid #eee", backgroundColor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={brandLogo} alt="Brand preview" style={{ maxWidth: "80px", maxHeight: "35px", objectFit: "contain" }} />
                        </div>
                      </div>
                    )}

                    <div className="admin-form-group" style={{ alignSelf: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={brandActive}
                          onChange={(e) => setBrandActive(e.target.checked)}
                          style={{ width: "16px", height: "16px" }}
                        />
                        Faol (Karuselda ko‘rinsin)
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                    {editingBrandId && (
                      <button type="button" onClick={resetBrandForm} className="admin-btn admin-btn--secondary">
                        Bekor qilish
                      </button>
                    )}
                    <button type="submit" disabled={saving || uploadingBrandLogo} className="admin-btn admin-btn--primary">
                      {editingBrandId ? "Brendni Yangilash" : "+ Brend Qo‘shish"}
                    </button>
                  </div>
                </form>

                {/* Brands Table */}
                <div style={{ marginTop: "2rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", textTransform: "uppercase" }}>
                    Mavjud Brendlar ({brandsList.length})
                  </h3>
                  {brandsList.length === 0 ? (
                    <p style={{ color: "var(--adm-text-muted)" }}>Hozircha birorta brend kiritilmagan.</p>
                  ) : (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: "60px", textAlign: "center" }}>Tartib</th>
                            <th>Brend Nomi</th>
                            <th>Logotip</th>
                            <th style={{ width: "80px", textAlign: "center" }}>Balandlik</th>
                            <th style={{ width: "80px", textAlign: "center" }}>Holat</th>
                            <th style={{ width: "150px", textAlign: "right" }}>Amallar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brandsList.map((item) => (
                            <tr key={item.id}>
                              <td style={{ textAlign: "center", fontWeight: 700 }}>{item.order}</td>
                              <td style={{ fontWeight: 700 }}>{item.name}</td>
                              <td>
                                {item.logo_url ? (
                                  <div style={{ width: "70px", height: "30px", border: "1px solid #eee", backgroundColor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <img src={item.logo_url} alt={item.name} style={{ maxWidth: "60px", maxHeight: "25px", objectFit: "contain" }} />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "var(--adm-text-muted)", fontStyle: "italic" }}>
                                    Standart SVG / Matn
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--adm-text-secondary)" }}>
                                {item.height}px
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBrandStatus(item)}
                                  className={`admin-badge ${item.is_active ? "admin-badge--success" : "admin-badge--muted"}`}
                                  style={{ cursor: "pointer", border: "none" }}
                                >
                                  {item.is_active ? "Faol" : "Nofaol"}
                                </button>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditBrand(item)}
                                    className="admin-btn admin-btn--secondary admin-btn--sm"
                                  >
                                    Tahrirlash
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBrand(item.id, item.name)}
                                    className="admin-btn admin-btn--danger admin-btn--sm"
                                  >
                                    O‘chirish
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FOOTER                                                             */}
          {/* ========================================================================= */}
          {activeTab === "footer" && (
            <div className="admin-card">
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                Footer Bo‘limi
              </h2>

              <div className="admin-form-group">
                <label className="admin-form-label">Footer Prefiks / Label</label>
                <input
                  type="text"
                  value={footerLabel}
                  onChange={(e) => setFooterLabel(e.target.value)}
                  placeholder="Xullas /"
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Footer Xulosa Matni</label>
                <textarea
                  value={footerStatement}
                  onChange={(e) => setFooterStatement(e.target.value)}
                  rows={4}
                  className="admin-textarea"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
