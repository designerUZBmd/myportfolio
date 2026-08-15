"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  title: string;
  slug: string;
};

type CaseSection = {
  title: string;
  content: string;
};

type GalleryItem = {
  type: "image" | "video";
  url: string;
};

export default function CreatePortfolioPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [sections, setSections] = useState<CaseSection[]>([
    { title: "Loyiha Haqida", content: "" },
  ]);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, title, slug")
        .eq("is_active", true)
        .order("order");

      if (data) {
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    }

    loadCategories();
  }, []);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  }

  // Cover image upload
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setCoverUrl(data.url);
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      alert("Rasm yuklashda xatolik yuz berdi");
    } finally {
      setUploadingCover(false);
    }
  }

  // Gallery multi-upload
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploadingGallery(true);

    try {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          setGallery((prev) => [
            ...prev,
            { type: data.type === "video" ? "video" : "image", url: data.url },
          ]);
        }
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      alert("Galereya fayllarini yuklashda xatolik yuz berdi");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !slug.trim()) {
      alert("Loyiha sarlavhasi va slug maydoni majburiy!");
      return;
    }

    if (!categoryId) {
      alert("Iltimos, kategoriya tanlang!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("portfolio_cases").insert({
      title: title.trim(),
      slug: slug.trim(),
      category_id: categoryId,
      cover_type: "image",
      cover_url: coverUrl.trim(),
      excerpt: excerpt.trim(),
      description: description.trim(),
      year: Number(year),
      gallery,
      sections: sections.filter((s) => s.title.trim() || s.content.trim()),
      is_featured: isFeatured,
      is_published: isPublished,
    });

    setLoading(false);

    if (error) {
      console.error("Insert case error:", error);
      alert("Saqlashda xatolik yuz berdi: " + error.message);
    } else {
      router.push("/admin/portfolio");
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <form onSubmit={handleSubmit}>
        <div className="admin-page-header">
          <div>
            <div style={{ marginBottom: "0.4rem" }}>
              <Link href="/admin/portfolio" style={{ color: "var(--adm-text-muted)", textDecoration: "none", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ← Loyihalar ro‘yxati
              </Link>
            </div>
            <h1 className="admin-page-title">Yangi Portfolio Keys</h1>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/admin/portfolio" className="admin-btn admin-btn--secondary">
              Bekor qilish
            </Link>
            <button type="submit" disabled={loading || uploadingCover || uploadingGallery} className="admin-btn admin-btn--primary">
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>

        {/* 1. Asosiy Ma'lumotlar Card */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", color: "var(--adm-text-primary)" }}>
            1. Asosiy Ma‘lumotlar
          </h2>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Loyiha Nomi *</label>
              <input
                type="text"
                placeholder="Masalan: PAYME FINTECH"
                value={title}
                onChange={handleTitleChange}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Havola (Slug) *</label>
              <input
                type="text"
                placeholder="payme-fintech"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-row" style={{ marginTop: "0.5rem" }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Kategoriya *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="admin-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Yil</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: "0.5rem" }}>
            <label className="admin-form-label">Qisqacha Izoh (Excerpt)</label>
            <input
              type="text"
              placeholder="Masalan: Mobile Banking UX/UI Redesign"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="admin-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">To‘liq Tavsif (Description)</label>
            <textarea
              placeholder="Loyiha tavsifi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-textarea"
              rows={4}
            />
          </div>
        </div>

        {/* 2. Asosiy Rasm (Cover) */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", color: "var(--adm-text-primary)" }}>
            2. Asosiy Muqova Rasmi
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: coverUrl ? "200px 1fr" : "1fr", gap: "1.25rem", alignItems: "start" }}>
            {coverUrl && (
              <div style={{ position: "relative", border: "1px solid var(--adm-surface-border)" }}>
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }}
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#000",
                    color: "white",
                    border: "none",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                  title="O‘chirish"
                >
                  ✕
                </button>
              </div>
            )}

            <div>
              <label className="admin-dropzone" style={{ display: "block", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, color: "var(--adm-text-primary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {uploadingCover ? "Yuklanmoqda..." : "Faylni tanlang (Cloudinary)"}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  style={{ display: "none" }}
                />
              </label>

              <div className="admin-form-group">
                <label className="admin-form-label" style={{ fontSize: "0.72rem" }}>
                  Yoki rasm URL manzili:
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="admin-input"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Keys Bo'limlari (Case Sections) */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, color: "var(--adm-text-primary)" }}>
              3. Keys Bo‘limlari
            </h2>

            <button
              type="button"
              onClick={() => setSections([...sections, { title: "", content: "" }])}
              className="admin-btn admin-btn--secondary admin-btn--sm"
            >
              + Bo‘lim qo‘shish
            </button>
          </div>

          {sections.map((section, idx) => (
            <div key={idx} className="admin-section-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-text-secondary)" }}>
                  Bo‘lim #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setSections(sections.filter((_, i) => i !== idx))}
                  style={{ color: "var(--adm-danger)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}
                >
                  O‘chirish ✕
                </button>
              </div>

              <div className="admin-form-group">
                <input
                  type="text"
                  placeholder="Bo‘lim sarlavhasi"
                  value={section.title}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[idx].title = e.target.value;
                    setSections(copy);
                  }}
                  className="admin-input"
                  style={{ marginBottom: "0.5rem" }}
                />

                <textarea
                  placeholder="Bo‘lim matni..."
                  value={section.content}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[idx].content = e.target.value;
                    setSections(copy);
                  }}
                  className="admin-textarea"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 4. Galereya */}
        <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, color: "var(--adm-text-primary)" }}>
              4. Keys Galereyasi ({gallery.length} ta fayl)
            </h2>
          </div>

          <label className="admin-dropzone" style={{ display: "block" }}>
            <div style={{ fontWeight: 600, color: "var(--adm-text-primary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {uploadingGallery ? "Yuklanmoqda..." : "Rasm yoki video tanlang"}
            </div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleGalleryUpload}
              disabled={uploadingGallery}
              style={{ display: "none" }}
            />
          </label>

          {gallery.length > 0 && (
            <div className="admin-gallery-grid">
              {gallery.map((item, i) => (
                <div key={i} className="admin-gallery-item">
                  {item.type === "image" ? (
                    <img src={item.url} alt={`Gallery item ${i + 1}`} />
                  ) : (
                    <video src={item.url} controls />
                  )}
                  <button
                    type="button"
                    className="admin-gallery-delete"
                    onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                    title="O‘chirish"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Sozlamalar */}
        <div className="admin-card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", color: "var(--adm-text-primary)" }}>
            5. Sozlamalar
          </h2>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <label className="admin-switch-label">
              <input
                type="checkbox"
                className="admin-switch-input"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span>Saytda E‘lon Qilish (Published)</span>
            </label>

            <label className="admin-switch-label">
              <input
                type="checkbox"
                className="admin-switch-input"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>Asosiy Loyiha (Featured)</span>
            </label>
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginBottom: "3rem" }}>
          <Link href="/admin/portfolio" className="admin-btn admin-btn--secondary">
            Bekor qilish
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingCover || uploadingGallery}
            className="admin-btn admin-btn--primary"
          >
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}
