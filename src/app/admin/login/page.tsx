"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Kirishda xatolik: " + authError.message);
        setLoading(false);
        return;
      }

      if (data?.session || data?.user) {
        window.location.href = "/admin/portfolio";
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError("Kutilmagan xatolik yuz berdi: " + msg);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "1.5rem",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        className="admin-card"
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "2.5rem 2rem",
          border: "1px solid var(--adm-surface-border)",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--adm-text-primary)" }}>
            OBLOQULOV / CMS
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--adm-text-muted)", marginTop: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Admin Kirish
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              border: "1px solid #dc2626",
              color: "#dc2626",
              fontSize: "0.8rem",
              marginBottom: "1.25rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label className="admin-form-label">Email Manzil</label>
            <input
              type="email"
              placeholder="admin@portfolio.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: "1.75rem" }}>
            <label className="admin-form-label">Parol</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn--primary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "0.85rem" }}
          >
            {loading ? "Kirilmoqda..." : "Kirish →"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem" }}>
          <Link
            href="/"
            style={{ fontSize: "0.8rem", color: "var(--adm-text-muted)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            ← Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
