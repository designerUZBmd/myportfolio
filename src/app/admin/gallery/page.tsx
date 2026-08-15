"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Section = {
  id: string;
  title: string;
  order?: number;
};

type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  created_at?: string;
};

export default function AdminGalleryPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchSections() {
    const { data } = await supabase
      .from("gallery_sections")
      .select("*")
      .order("order", { ascending: true });

    setSections(data || []);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data } = await supabase
        .from("gallery_sections")
        .select("*")
        .order("order", { ascending: true });

      if (!ignore) {
        setSections(data || []);
        setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  async function createSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    const { error } = await supabase.from("gallery_sections").insert({
      title: newTitle.trim(),
      order: sections.length,
    });
    setCreating(false);

    if (!error) {
      setNewTitle("");
      fetchSections();
    } else {
      alert("Bo‘lim qo‘shishda xatolik: " + error.message);
    }
  }

  async function deleteSection(id: string, title: string) {
    const ok = confirm(`"${title}" bo‘limini o‘chirishni tasdiqlaysizmi?`);
    if (!ok) return;

    await supabase.from("gallery_items").delete().eq("section_id", id);
    const { error } = await supabase.from("gallery_sections").delete().eq("id", id);

    if (!error) {
      setSections((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("O‘chirishda xatolik: " + error.message);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Galereya CMS</h1>
          <p className="admin-page-subtitle">
            Saytdagi /gallery sahifasi bo‘limlari ({sections.length} ta bo‘lim)
          </p>
        </div>
      </div>

      {/* Add New Section Card */}
      <div className="admin-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", color: "var(--adm-text-primary)" }}>
          + Yangi Bo‘lim Qo‘shish
        </h2>

        <form onSubmit={createSection} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <label className="admin-form-label" style={{ marginBottom: "0.4rem", display: "block" }}>
              Bo‘lim Nomi
            </label>
            <input
              type="text"
              placeholder="Masalan: 3D Visuals yoki Branding"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="admin-btn admin-btn--primary"
            style={{ height: "42px" }}
          >
            {creating ? "Qo‘shilmoqda..." : "Bo‘limni Yaratish"}
          </button>
        </form>
      </div>

      {/* List of Sections with media */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {sections.map((section) => (
          <GallerySectionBlock
            key={section.id}
            section={section}
            onDeleteSection={() => deleteSection(section.id, section.title)}
          />
        ))}

        {sections.length === 0 && !loading && (
          <div className="admin-card">
            <div className="admin-empty-state">
              <p>Hozircha hech qanday galereya bo‘limi mavjud emas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GallerySectionBlock({
  section,
  onDeleteSection,
}: {
  section: Section;
  onDeleteSection: () => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetchItems() {
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("section_id", section.id)
      .order("created_at", { ascending: false });

    setItems(data || []);
  }

  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("section_id", section.id)
        .order("created_at", { ascending: false });

      if (!ignore) {
        setItems(data || []);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [section.id]);

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);

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
          await supabase.from("gallery_items").insert({
            section_id: section.id,
            type: data.type === "video" ? "video" : "image",
            url: data.url,
          });
        }
      }
      fetchItems();
    } catch (err) {
      console.error("Gallery media upload error:", err);
      alert("Media yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  }

  async function deleteItem(id: string) {
    const ok = confirm("Ushbu faylni o‘chirishni tasdiqlaysizmi?");
    if (!ok) return;

    const { error } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-text-primary)" }}>
            {section.title}
          </h3>
          <span style={{ fontSize: "0.75rem", color: "var(--adm-text-muted)" }}>
            {items.length} ta fayl
          </span>
        </div>

        <button
          onClick={onDeleteSection}
          className="admin-btn admin-btn--danger admin-btn--sm"
        >
          Bo‘limni O‘chirish
        </button>
      </div>

      {/* Upload Dropzone */}
      <label className="admin-dropzone" style={{ display: "block", marginBottom: "1.25rem" }}>
        <div style={{ fontWeight: 600, color: "var(--adm-text-primary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {uploading ? "Yuklanmoqda..." : "Rasm yoki video yuklang"}
        </div>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleMediaUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="admin-gallery-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {items.map((item) => (
            <div key={item.id} className="admin-gallery-item" style={{ height: "110px" }}>
              {item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="Gallery item" />
              ) : (
                <video src={item.url} controls />
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  background: "#000",
                  color: "#fff",
                  fontSize: "0.6rem",
                  padding: "0.1rem 0.3rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {item.type}
              </span>
              <button
                type="button"
                className="admin-gallery-delete"
                onClick={() => deleteItem(item.id)}
                title="O‘chirish"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "1rem 0", color: "var(--adm-text-muted)", fontSize: "0.8rem" }}>
          Hozircha media fayllar yo‘q
        </div>
      )}
    </div>
  );
}
