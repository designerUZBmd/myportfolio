"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CloudinaryMediaModal, {
  SelectedMediaItem,
} from "@/components/admin/CloudinaryMediaModal";

type DashboardStats = {
  totalCases: number;
  publishedCases: number;
  totalCategories: number;
  totalGalleryItems: number;
  totalDirections: number;
  totalBrands: number;
};

type RecentCase = {
  id: string;
  title: string;
  slug: string;
  year: number;
  is_published: boolean;
  cover_url: string;
  created_at: string;
  categories: { title: string }[] | null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    publishedCases: 0,
    totalCategories: 0,
    totalGalleryItems: 0,
    totalDirections: 0,
    totalBrands: 0,
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Favicon & Dynamic Title states
  const [faviconUrl, setFaviconUrl] = useState("");
  const [titleWords, setTitleWords] = useState<string[]>([
    "✦ Obloqulov — Digital Designer",
    "✦ Obloqulov — UI/UX Specialist",
    "✦ Obloqulov — 3D & Creative Dev",
  ]);
  const [rotationInterval, setRotationInterval] = useState<number>(2.5);
  const [rotationEnabled, setRotationEnabled] = useState<boolean>(true);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [faviconModalOpen, setFaviconModalOpen] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: casesData } = await supabase
          .from("portfolio_cases")
          .select("id, title, slug, year, is_published, cover_url, created_at, categories(title)")
          .order("created_at", { ascending: false });

        const { data: catData } = await supabase
          .from("categories")
          .select("id");

        const { data: galData } = await supabase
          .from("gallery_items")
          .select("id");

        const { data: dirData } = await supabase
          .from("directions")
          .select("id");

        const { data: brandData } = await supabase
          .from("brands")
          .select("id");

        const cases = casesData || [];
        const publishedCount = cases.filter((c) => c.is_published).length;

        setStats({
          totalCases: cases.length,
          publishedCases: publishedCount,
          totalCategories: (catData || []).length,
          totalGalleryItems: (galData || []).length,
          totalDirections: (dirData || []).length,
          totalBrands: (brandData || []).length,
        });

        setRecentCases(cases.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/favicon");
        const data = await res.json();
        if (data.success) {
          if (data.favicon_url !== undefined) {
            setFaviconUrl(data.favicon_url);
          }
          if (Array.isArray(data.title_words) && data.title_words.length > 0) {
            setTitleWords(data.title_words);
          }
          if (data.title_rotation_interval) {
            setRotationInterval(Number(data.title_rotation_interval));
          }
          if (typeof data.title_rotation_enabled === "boolean") {
            setRotationEnabled(data.title_rotation_enabled);
          }
        }
      } catch (e) {
        console.error("Favicon/settings load error:", e);
      }
    }

    loadDashboardData();
    loadSettings();
  }, []);

  // Real-time animated cycling for tab mockup preview
  useEffect(() => {
    if (!rotationEnabled || titleWords.length <= 1) {
      setPreviewIndex(0);
      return;
    }
    const intervalMs = Math.max(1000, (Number(rotationInterval) || 2.5) * 1000);
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % titleWords.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [rotationEnabled, rotationInterval, titleWords.length]);

  async function handleSaveSettings(overrideUrl?: string) {
    const fUrl = (overrideUrl !== undefined ? overrideUrl : faviconUrl).trim();
    const validWords = titleWords.map((w) => w.trim()).filter((w) => w.length > 0);
    const wordsToSave = validWords.length > 0 ? validWords : ["Obloqulov"];

    setSavingSettings(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/admin/favicon", {
        method: "POST",
        headers,
        body: JSON.stringify({
          favicon_url: fUrl,
          title_rotation_enabled: rotationEnabled,
          title_rotation_interval: Math.max(1, Number(rotationInterval) || 2.5),
          title_words: wordsToSave,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFaviconUrl(data.favicon_url || "");
        setTitleWords(data.title_words || wordsToSave);
        setRotationInterval(data.title_rotation_interval || 2.5);
        setRotationEnabled(data.title_rotation_enabled !== false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert("Sozlamalarni saqlashda xatolik: " + (data.error || "Noma'lum xato"));
      }
    } catch {
      alert("Server bilan bog‘lanishda xatolik yuz berdi");
    } finally {
      setSavingSettings(false);
    }
  }

  function handleWordChange(index: number, val: string) {
    setTitleWords((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function handleAddWord() {
    setTitleWords((prev) => [...prev, ""]);
  }

  function handleRemoveWord(index: number) {
    if (titleWords.length <= 1) {
      alert("Kamida 1 ta sarlavha qolishi lozim!");
      return;
    }
    setTitleWords((prev) => prev.filter((_, i) => i !== index));
    if (previewIndex >= titleWords.length - 1) {
      setPreviewIndex(0);
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setFaviconUrl(data.url);
        handleSaveSettings(data.url);
      }
    } catch (err) {
      console.error("Favicon upload error:", err);
      alert("Favikon yuklashda xatolik yuz berdi");
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  }

  function handleCloudinarySelect(items: SelectedMediaItem[]) {
    if (items.length > 0) {
      const url = items[0].url;
      setFaviconUrl(url);
      handleSaveSettings(url);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Boshqaruv Paneli</h1>
          <p className="admin-page-subtitle">
            Portfolio va kontentning umumiy statistikasi
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/home" className="admin-btn admin-btn--secondary">
            🏠 Bosh Sahifa Sozlamalari
          </Link>
          <Link href="/admin/portfolio/create" className="admin-btn admin-btn--primary">
            + Yangi Loyiha
          </Link>
        </div>
      </div>

      {/* 1. Sayt Favikoni va Dinamik Tab Sarlavhasi (Brauzer Sarlavhalari Boshqaruvi) */}
      <div
        className="admin-card"
        style={{
          marginBottom: "2rem",
          border: "1px solid var(--adm-surface-border)",
          backgroundColor: "#ffffff",
          padding: "1.5rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--adm-surface-border)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🌐</span>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                  color: "var(--adm-text-primary)",
                }}
              >
                Sayt Favikoni va Dinamik Tab Sarlavhasi
              </h2>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--adm-text-secondary)",
                margin: "0.35rem 0 0",
              }}
            >
              Brauzer oynasi tepasidagi kichik logotip va navbatma-navbat aylanib turuvchi sarlavha matnlari
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {saveSuccess && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#059669",
                  backgroundColor: "#ecfdf5",
                  padding: "0.4rem 0.75rem",
                  border: "1px solid #10b981",
                  borderRadius: "3px",
                }}
              >
                ✓ Sozlamalar saqlandi!
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="admin-btn admin-btn--primary admin-btn--sm"
              style={{ fontWeight: 600 }}
            >
              {savingSettings ? "⏳ Saqlanmoqda..." : "💾 Saqlash"}
            </button>
          </div>
        </div>

        {/* Live Browser Tab Preview Bar */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--adm-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>🖥 Brauzerda Jonli Ko‘rinishi (Jonli Prevyu):</span>
            </span>

            {/* Indicator badge */}
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.2rem 0.6rem",
                borderRadius: "12px",
                backgroundColor: rotationEnabled && titleWords.length > 1 ? "#ecfdf5" : "#f3f4f6",
                color: rotationEnabled && titleWords.length > 1 ? "#065f46" : "#6b7280",
                border: `1px solid ${rotationEnabled && titleWords.length > 1 ? "#a7f3d0" : "#e5e7eb"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: rotationEnabled && titleWords.length > 1 ? "#10b981" : "#9ca3af",
                }}
              />
              {rotationEnabled && titleWords.length > 1
                ? `Aylanmoqda (${(previewIndex % titleWords.length) + 1} / ${titleWords.length}) — har ${rotationInterval} soniyada`
                : "Statik holatda (Aylanish o‘chirilgan)"}
            </span>
          </div>

          {/* Realistic Browser Window Bar */}
          <div
            style={{
              backgroundColor: "#e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #d1d5db",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px 0",
                gap: "10px",
              }}
            >
              {/* Traffic light dots */}
              <div style={{ display: "flex", gap: "6px", marginRight: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              </div>

              {/* Active Tab */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "6px 6px 0 0",
                  padding: "7px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "#111827",
                  boxShadow: "0 -1px 3px rgba(0,0,0,0.05)",
                  maxWidth: "360px",
                  minWidth: "220px",
                }}
              >
                {/* Favicon in tab */}
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "3px",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconUrl}
                      alt="Favicon"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: "11px" }}>🌐</span>
                  )}
                </div>

                {/* Animated cycling text */}
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    fontWeight: 600,
                  }}
                >
                  {titleWords[previewIndex % (titleWords.length || 1)] || "Obloqulov — Digital Designer"}
                </span>

                <span style={{ color: "#9ca3af", fontSize: "11px", marginLeft: "4px" }}>✕</span>
              </div>

              {/* Plus tab icon */}
              <div style={{ color: "#6b7280", fontSize: "14px", padding: "0 6px" }}>+</div>
            </div>
          </div>
        </div>

        {/* 1-Qism: Favikon Belgisi (Logotip) */}
        <div
          style={{
            marginBottom: "1.75rem",
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            border: "1px solid var(--adm-surface-border)",
            borderRadius: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              1. Favikon Logotipi (Rasm)
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor: "#f9fafb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faviconUrl}
                    alt="Favicon preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: "1.5rem" }}>🌐</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setFaviconModalOpen(true)}
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <span>🖼 Cloudinary’dan Tanlash</span>
                </button>

                <label
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  style={{
                    cursor: uploadingFavicon ? "wait" : "pointer",
                    margin: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{uploadingFavicon ? "⏳ Yuklanmoqda..." : "⬆ Kompyuterdan Yuklash"}</span>
                  <input
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp,.ico"
                    onChange={handleFaviconUpload}
                    disabled={uploadingFavicon}
                    style={{ display: "none" }}
                  />
                </label>

                {faviconUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFaviconUrl("");
                      handleSaveSettings("");
                    }}
                    className="admin-btn admin-btn--sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <span>🗑 O‘chirish</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  color: "var(--adm-text-secondary)",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Rasm URL manzili:
              </label>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/... yoki rasm URL manzili"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                className="admin-input"
                style={{ fontSize: "0.8rem", padding: "0.45rem 0.75rem", width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* 2-Qism: Dinamik Sarlavhalar va Aylanish Sozlamalari */}
        <div
          style={{
            marginBottom: "1.75rem",
            padding: "1.25rem",
            backgroundColor: "#ffffff",
            border: "1px solid var(--adm-surface-border)",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px dashed #e2e8f0",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: 0,
                  color: "var(--adm-text-primary)",
                }}
              >
                2. Dinamik Sarlavhalar va Aylanish Parametrlari
              </h3>
              <p style={{ fontSize: "0.72rem", color: "var(--adm-text-secondary)", margin: "0.25rem 0 0" }}>
                Brauzer tabida navbatma-navbat almashib turuvchi so‘zlar va ularning ko‘rsatilish vaqti
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rotationEnabled}
                  onChange={(e) => setRotationEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span>Aylanish faol (Animatsiya)</span>
              </label>
            </div>
          </div>

          {/* Speed / Interval Setting */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              alignItems: "center",
              marginBottom: "1.25rem",
              padding: "0.85rem 1rem",
              backgroundColor: "#f8fafc",
              borderRadius: "4px",
              border: "1px solid #edf2f7",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--adm-text-primary)",
                  display: "block",
                  marginBottom: "0.2rem",
                }}
              >
                ⏱ Aylanish tezligi (Har bir so‘z necha soniya turishi):
              </label>
              <span style={{ fontSize: "0.72rem", color: "var(--adm-text-secondary)" }}>
                Har bir sarlavha brauzer oynasida belgilangan soniyada turadi va keyingisiga o‘tadi
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                min="1"
                max="60"
                step="0.5"
                value={rotationInterval}
                onChange={(e) => setRotationInterval(Math.max(1, Number(e.target.value) || 1))}
                className="admin-input"
                style={{
                  width: "90px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "0.45rem 0.5rem",
                }}
              />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--adm-text-primary)" }}>
                soniya
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--adm-text-muted)" }}>
                (Tavsiya: 2.0 — 3.5 soniya)
              </span>
            </div>
          </div>

          {/* Words / Titles List */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  color: "var(--adm-text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>Aylanuvchi Sarlavhalar Ro‘yxati:</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    backgroundColor: "var(--adm-surface-border)",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "3px",
                  }}
                >
                  {titleWords.length} ta so‘z
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddWord}
                className="admin-btn admin-btn--secondary admin-btn--sm"
                style={{ fontSize: "0.75rem", fontWeight: 600 }}
              >
                + Yangi Sarlavha Qo‘shish
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {titleWords.map((word, index) => {
                const isCurrentlyActive = rotationEnabled && previewIndex % titleWords.length === index;
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.5rem 0.65rem",
                      backgroundColor: isCurrentlyActive ? "#f0fdf4" : "#fcfcfc",
                      border: `1px solid ${isCurrentlyActive ? "#86efac" : "#e5e7eb"}`,
                      borderRadius: "4px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Index Badge */}
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "3px",
                        backgroundColor: isCurrentlyActive ? "#16a34a" : "#f3f4f6",
                        color: isCurrentlyActive ? "#ffffff" : "#4b5563",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      title={isCurrentlyActive ? "Hozir prevyuda ko‘rsatilmoqda" : `Sarlavha #${index + 1}`}
                    >
                      {index + 1}
                    </span>

                    {/* Word Input */}
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => handleWordChange(index, e.target.value)}
                      placeholder="Masalan: ✦ Obloqulov — Digital Designer"
                      className="admin-input"
                      style={{
                        flex: 1,
                        fontSize: "0.82rem",
                        padding: "0.45rem 0.75rem",
                        backgroundColor: "#ffffff",
                      }}
                    />

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(index)}
                      disabled={titleWords.length <= 1}
                      className="admin-btn admin-btn--sm"
                      style={{
                        color: titleWords.length <= 1 ? "#9ca3af" : "#ef4444",
                        backgroundColor: "transparent",
                        border: "1px solid",
                        borderColor: titleWords.length <= 1 ? "#e5e7eb" : "#fecaca",
                        cursor: titleWords.length <= 1 ? "not-allowed" : "pointer",
                        padding: "0.4rem 0.65rem",
                        fontSize: "0.75rem",
                      }}
                      title={titleWords.length <= 1 ? "Kamida bitta sarlavha qolishi lozim" : "O‘chirish"}
                    >
                      ✕ O‘chirish
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleAddWord}
                className="admin-btn admin-btn--secondary admin-btn--sm"
                style={{ fontSize: "0.75rem" }}
              >
                + Yana Bitta Sarlavha Qo‘shish
              </button>
              <span style={{ fontSize: "0.7rem", color: "var(--adm-text-muted)" }}>
                Tavsiya: Sarlavhalar 2 tadan 5 tagacha bo‘lsa foydalanuvchiga eng yaxshi taassurot qoldiradi.
              </span>
            </div>
          </div>
        </div>

        {/* Global Save Action Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.25rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "4px",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <strong style={{ fontSize: "0.8rem", color: "var(--adm-text-primary)", display: "block" }}>
              💾 O‘zgarishlarni saqlash
            </strong>
            <span style={{ fontSize: "0.72rem", color: "var(--adm-text-secondary)" }}>
              Favikon va sarlavhalar saqlangach, saytga kirgan barcha tashrif buyuruvchilarda darhol ishlaydi.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {saveSuccess && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#059669",
                  backgroundColor: "#ecfdf5",
                  padding: "0.4rem 0.75rem",
                  border: "1px solid #10b981",
                  borderRadius: "2px",
                }}
              >
                ✓ Barcha sozlamalar saqlandi!
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="admin-btn admin-btn--primary"
              style={{ padding: "0.55rem 1.5rem", fontWeight: 700, fontSize: "0.85rem" }}
            >
              {savingSettings ? "⏳ Saqlanmoqda..." : "💾 Barcha Sozlamalarni Saqlash"}
            </button>
          </div>
        </div>

        {/* Detailed Helper Guide on Sizes and Formats */}
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "4px",
            fontSize: "0.73rem",
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--adm-text-primary)", display: "block", marginBottom: "0.25rem" }}>
            📐 Favikon va Tab Sarlavhasi bo‘yicha Qo‘llanma (Tavsiyalar):
          </strong>
          <div>
            • <strong>Favikon formatlari:</strong> <code>.png</code>, <code>.ico</code> yoki <code>.svg</code> (orqa foni shaffof / transparent bo‘lgani eng chiroyli chiqadi).
          </div>
          <div>
            • <strong>Tavsiya etilgan o‘lcham:</strong> <strong>512 × 512 px</strong> (yoki <strong>192 × 192 px</strong>) kvadrat PNG. Bu o‘lcham Retina ekranlarda va Google qidiruvida tiniq ko‘rinadi. Nisbati qat’iy <strong>1:1 (teng kvadrat)</strong> bo‘lishi lozim.
          </div>
          <div>
            • <strong>Dinamik sarlavhalar:</strong> Har bir sarlavha oldiga maxsus belgilar (masalan: <code>✦</code>, <code>●</code> yoki <code>⚡</code>) qo‘yish dizaynerlik uslubini kuchaytiradi. So‘zlar uzunligi 20–35 ta harfdan oshmasligi tavsiya qilinadi.
          </div>
        </div>
      </div>

      <CloudinaryMediaModal
        isOpen={faviconModalOpen}
        onClose={() => setFaviconModalOpen(false)}
        onSelect={handleCloudinarySelect}
        multiple={false}
        mediaType="image"
        title="Favikon uchun Rasm Tanlash"
      />

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Jami Loyihalar</span>
          <span className="admin-stat-value">{stats.totalCases}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">E‘lon qilingan</span>
          <span className="admin-stat-value">{stats.publishedCases}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Kategoriyalar</span>
          <span className="admin-stat-value">{stats.totalCategories}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Yo‘nalishlar</span>
          <span className="admin-stat-value">{stats.totalDirections}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Brendlar</span>
          <span className="admin-stat-value">{stats.totalBrands}</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Galereya Medialari</span>
          <span className="admin-stat-value">{stats.totalGalleryItems}</span>
        </div>
      </div>

      {/* Recent Cases Section */}
      <div className="admin-card" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            So‘nggi Loyihalar
          </h2>
          <Link href="/admin/portfolio" style={{ fontSize: "0.8rem", color: "var(--adm-text-primary)", textDecoration: "underline", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Barchasi →
          </Link>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Muqova</th>
                <th>Nomi</th>
                <th>Kategoriya</th>
                <th>Yili</th>
                <th>Holati</th>
                <th style={{ textAlign: "right" }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        className="admin-table-thumb"
                      />
                    ) : (
                      <div className="admin-table-thumb" />
                    )}
                  </td>
                  <td>
                    <strong style={{ color: "var(--adm-text-primary)" }}>{item.title}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--adm-text-muted)" }}>
                      /{item.slug}
                    </div>
                  </td>
                  <td>
                    {item.categories?.[0]?.title ? (
                      <span className="admin-badge">
                        {item.categories[0].title}
                      </span>
                    ) : (
                      <span style={{ color: "var(--adm-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{item.year || "—"}</td>
                  <td>
                    {item.is_published ? (
                      <span className="admin-badge admin-badge--success">Faol</span>
                    ) : (
                      <span className="admin-badge admin-badge--muted">Qoralama</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/admin/portfolio/${item.id}/edit`}
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                    >
                      Tahrirlash
                    </Link>
                  </td>
                </tr>
              ))}

              {recentCases.length === 0 && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <p>Hozircha hech qanday loyiha qo‘shilmagan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
