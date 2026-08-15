"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DashboardStats = {
  totalCases: number;
  publishedCases: number;
  totalCategories: number;
  totalGalleryItems: number;
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
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);

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

        const cases = casesData || [];
        const publishedCount = cases.filter((c) => c.is_published).length;

        setStats({
          totalCases: cases.length,
          publishedCases: publishedCount,
          totalCategories: (catData || []).length,
          totalGalleryItems: (galData || []).length,
        });

        setRecentCases(cases.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Boshqaruv Paneli</h1>
          <p className="admin-page-subtitle">
            Portfolio va kontentning umumiy statistikasi
          </p>
        </div>

        <div>
          <Link href="/admin/portfolio/create" className="admin-btn admin-btn--primary">
            + Yangi Loyiha
          </Link>
        </div>
      </div>

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
