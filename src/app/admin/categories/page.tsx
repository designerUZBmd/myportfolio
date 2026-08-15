"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  title: string;
  slug: string;
  order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("order");

    setCategories(data || []);
    if (data && data.length > 0) {
      setOrder(data.length);
    }
    setFetching(false);
  }

  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("order");

      if (!ignore) {
        setCategories(data || []);
        if (data && data.length > 0) {
          setOrder(data.length);
        }
        setFetching(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
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

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    setLoading(true);

    const { error } = await supabase.from("categories").insert({
      title: title.trim(),
      slug: slug.trim(),
      order: Number(order),
      is_active: true,
    });

    setLoading(false);

    if (!error) {
      setTitle("");
      setSlug("");
      fetchCategories();
    } else {
      alert("Kategoriya yaratishda xatolik: " + error.message);
    }
  }

  async function deleteCategory(id: string, catTitle: string) {
    const ok = confirm(`"${catTitle}" kategoriyasini o‘chirishni tasdiqlaysizmi?`);
    if (!ok) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("O‘chirishda xatolik: " + error.message);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Kategoriyalar</h1>
          <p className="admin-page-subtitle">
            Portfolio kategoriyalari ({categories.length} ta kategoriya)
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Create Card */}
        <div className="admin-card">
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", color: "var(--adm-text-primary)" }}>
            + Yangi Kategoriya
          </h2>

          <form onSubmit={createCategory}>
            <div className="admin-form-group">
              <label className="admin-form-label">Kategoriya Nomi *</label>
              <input
                type="text"
                placeholder="Masalan: Web Design"
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
                placeholder="web-design"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Tartib Raqami</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="admin-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn--primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {loading ? "Qo‘shilmoqda..." : "Qo‘shish"}
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Tartib</th>
                <th>Kategoriya Nomi</th>
                <th>Slug</th>
                <th>Holati</th>
                <th style={{ textAlign: "right" }}>Amal</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--adm-text-muted)" }}>
                      #{cat.order}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "var(--adm-text-primary)" }}>
                      {cat.title}
                    </strong>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8rem", color: "var(--adm-text-secondary)" }}>
                      /{cat.slug}
                    </code>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--success">Faol</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => deleteCategory(cat.id, cat.title)}
                      className="admin-btn admin-btn--danger admin-btn--sm"
                    >
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && !fetching && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty-state">
                      <p>Hozircha kategoriyalar mavjud emas</p>
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
