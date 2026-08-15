"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PortfolioCase } from "@/types/database";

export default function AdminPortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PortfolioCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    let ignore = false;
    async function init() {
      const { data, error } = await supabase
        .from("portfolio_cases")
        .select(`
          id,
          title,
          slug,
          year,
          is_published,
          is_featured,
          cover_url,
          cover_type,
          excerpt,
          created_at,
          categories ( id, title, slug )
        `)
        .order("created_at", { ascending: false });

      if (!ignore) {
        if (!error && data) {
          setItems(data as unknown as PortfolioCase[]);
        }
        setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  async function deleteCase(id: string, title: string) {
    const ok = confirm(`"${title}" loyihasini o‘chirishni tasdiqlaysizmi?`);
    if (!ok) return;

    const { error } = await supabase
      .from("portfolio_cases")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert("O‘chirishda xatolik yuz berdi: " + error.message);
    }
  }

  async function togglePublish(item: PortfolioCase) {
    const nextStatus = !item.is_published;
    const { error } = await supabase
      .from("portfolio_cases")
      .update({ is_published: nextStatus })
      .eq("id", item.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_published: nextStatus } : i))
      );
    }
  }

  const filteredItems = items.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Portfolio Loyihalar</h1>
          <p className="admin-page-subtitle">
            Barcha keyslar ro‘yxati ({items.length} ta loyiha)
          </p>
        </div>

        <Link href="/admin/portfolio/create" className="admin-btn admin-btn--primary">
          + Yangi Loyiha
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Qidiruv (nomi yoki slug)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-input"
          style={{ maxWidth: "360px" }}
        />
      </div>

      {/* Cases Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>Muqova</th>
              <th>Loyiha Nomi</th>
              <th>Kategoriya</th>
              <th>Yili</th>
              <th>Status</th>
              <th>Asosiy</th>
              <th style={{ textAlign: "right" }}>Amallar</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => {
              const cat = Array.isArray(item.categories) ? item.categories[0] : item.categories;
              const categorySlug = cat?.slug || "web-design";

              return (
                <tr key={item.id}>
                  <td>
                    {item.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                    <strong style={{ color: "var(--adm-text-primary)" }}>
                      {item.title}
                    </strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                      /{categorySlug}/{item.slug}
                    </div>
                  </td>
                  <td>
                    {cat?.title ? (
                      <span className="admin-badge">
                        {cat.title}
                      </span>
                    ) : (
                      <span style={{ color: "var(--adm-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{item.year || "—"}</td>
                  <td>
                    <button
                      onClick={() => togglePublish(item)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    >
                      {item.is_published ? (
                        <span className="admin-badge admin-badge--success">Faol</span>
                      ) : (
                        <span className="admin-badge admin-badge--muted">Qoralama</span>
                      )}
                    </button>
                  </td>
                  <td>
                    {item.is_featured ? (
                      <span className="admin-badge">Asosiy</span>
                    ) : (
                      <span style={{ color: "var(--adm-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <Link
                        href={`/portfolio/${categorySlug}/${item.slug}`}
                        target="_blank"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                      >
                        Ko‘rish ↗
                      </Link>

                      <Link
                        href={`/admin/portfolio/${item.id}/edit`}
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                      >
                        Tahrirlash
                      </Link>

                      <button
                        onClick={() => deleteCase(item.id, item.title)}
                        className="admin-btn admin-btn--danger admin-btn--sm"
                      >
                        O‘chirish
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty-state">
                    <p>Hech qanday loyiha topilmadi</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
