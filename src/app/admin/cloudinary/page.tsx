"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { CloudinaryAsset } from "@/app/api/admin/cloudinary/route";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.error("Error retrieving session token:", e);
  }
  return {};
}

export default function AdminCloudinaryPage() {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "unused">("all");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Lightbox preview state
  const [previewAsset, setPreviewAsset] = useState<CloudinaryAsset | null>(null);

  // Copied state indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchAssets(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/cloudinary", {
        headers: {
          ...authHeaders,
        },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
      } else {
        alert("Fayllarni yuklashda xatolik: " + (data.error || "Noma'lum xato"));
      }
    } catch (err: unknown) {
      console.error("Cloudinary fetch error:", err);
      alert("Server bilan bog‘lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAssets();
  }, []);

  // Upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgress(`${i + 1}/${total} yuklanmoqda (${file.name})...`);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error("Upload failed for:", file.name);
        }
      }

      setUploadProgress("Muvaffaqiyatli yakunlandi!");
      setTimeout(() => setUploadProgress(null), 2000);
      fetchAssets(true);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      alert("Fayl yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Delete handler
  async function handleDelete(asset: CloudinaryAsset) {
    if (asset.is_used) {
      const places = asset.used_in.join("\n• ");
      const confirmed = confirm(
        `DIQQAT!\nUshbu fayl hozirda saytda FAOL ISHLATILMOQDA:\n• ${places}\n\nAgar uni o‘chirib yuborsangiz, saytda rasmlar/videolar ko‘rinmay buzilib qolishi mumkin.\n\nBaribir o‘chirib tashlashni tasdiqlaysizmi?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm(
        `"${asset.public_id}" faylini Cloudinary bulutli xotirasidan o‘chirishni tasdiqlaysizmi?`
      );
      if (!confirmed) return;
    }

    setDeletingId(asset.public_id);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/cloudinary", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          public_id: asset.public_id,
          resource_type: asset.resource_type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAssets((prev) => prev.filter((a) => a.public_id !== asset.public_id));
        if (previewAsset?.public_id === asset.public_id) {
          setPreviewAsset(null);
        }
      } else {
        alert("O‘chirishda xatolik: " + (data.error || "Noma'lum xatolik"));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("O‘chirishda server xatosi yuz berdi");
    } finally {
      setDeletingId(null);
    }
  }

  // Copy URL to clipboard
  function copyToClipboard(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // Format bytes to KB/MB
  function formatBytes(bytes: number) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Filtered list
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Type filter
      if (typeFilter !== "all" && asset.resource_type !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "used" && !asset.is_used) return false;
      if (statusFilter === "unused" && asset.is_used) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = asset.public_id.toLowerCase().includes(q);
        const matchesFormat = asset.format?.toLowerCase().includes(q);
        const matchesUsage = asset.used_in.some((u) => u.toLowerCase().includes(q));
        return matchesId || matchesFormat || matchesUsage;
      }

      return true;
    });
  }, [assets, typeFilter, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    return {
      total: assets.length,
      images: assets.filter((a) => a.resource_type === "image").length,
      videos: assets.filter((a) => a.resource_type === "video").length,
      used: assets.filter((a) => a.is_used).length,
      unused: assets.filter((a) => !a.is_used).length,
    };
  }, [assets]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Cloudinary Media Kutubxonasi</h1>
          <p className="admin-page-subtitle">
            Saytga yuklangan barcha rasm va videolar ({summary.total} ta fayl)
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => fetchAssets(true)}
            disabled={refreshing || loading}
            className="admin-btn admin-btn--secondary"
            title="Yangilash"
          >
            {refreshing ? "Yangilanmoqda..." : "⟳ Yangilash"}
          </button>

          <label
            className="admin-btn admin-btn--primary"
            style={{ cursor: uploading ? "wait" : "pointer", margin: 0 }}
          >
            {uploading ? (uploadProgress || "Yuklanmoqda...") : "+ Kompyuterdan yuklash"}
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--adm-text-secondary)", letterSpacing: "0.04em", fontWeight: 700 }}>
            Jami Media
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--adm-text-primary)" }}>
            {summary.total}
          </div>
        </div>

        <div className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--adm-text-secondary)", letterSpacing: "0.04em", fontWeight: 700 }}>
            Rasmlar
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--adm-text-primary)" }}>
            {summary.images}
          </div>
        </div>

        <div className="admin-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--adm-text-secondary)", letterSpacing: "0.04em", fontWeight: 700 }}>
            Videolar
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--adm-text-primary)" }}>
            {summary.videos}
          </div>
        </div>

        <div
          className="admin-card"
          style={{
            padding: "1rem",
            borderLeft: "3px solid #10b981",
            cursor: "pointer",
            backgroundColor: statusFilter === "used" ? "#f0fdf4" : undefined,
          }}
          onClick={() => setStatusFilter(statusFilter === "used" ? "all" : "used")}
        >
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#059669", letterSpacing: "0.04em", fontWeight: 700 }}>
            ● Saytda Faol
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.25rem", color: "#047857" }}>
            {summary.used}
          </div>
        </div>

        <div
          className="admin-card"
          style={{
            padding: "1rem",
            borderLeft: "3px solid #9ca3af",
            cursor: "pointer",
            backgroundColor: statusFilter === "unused" ? "#f9fafb" : undefined,
          }}
          onClick={() => setStatusFilter(statusFilter === "unused" ? "all" : "unused")}
        >
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--adm-text-secondary)", letterSpacing: "0.04em", fontWeight: 700 }}>
            Ishlatilmayotgan (Ortiqcha)
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--adm-text-secondary)" }}>
            {summary.unused}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          {/* Type Filter */}
          <div style={{ display: "flex", border: "1px solid var(--adm-surface-border)", padding: "2px" }}>
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: typeFilter === "all" ? "var(--adm-text-primary)" : "transparent",
                color: typeFilter === "all" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("image")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: typeFilter === "image" ? "var(--adm-text-primary)" : "transparent",
                color: typeFilter === "image" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              Rasmlar
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("video")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: typeFilter === "video" ? "var(--adm-text-primary)" : "transparent",
                color: typeFilter === "video" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              Videolar
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", border: "1px solid var(--adm-surface-border)", padding: "2px" }}>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: statusFilter === "all" ? "var(--adm-text-primary)" : "transparent",
                color: statusFilter === "all" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              Barcha holat
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("used")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: statusFilter === "used" ? "#10b981" : "transparent",
                color: statusFilter === "used" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              ● Saytda faol
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unused")}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: statusFilter === "unused" ? "#6b7280" : "transparent",
                color: statusFilter === "unused" ? "#fff" : "var(--adm-text-secondary)",
              }}
            >
              Ishlatilmayotgan
            </button>
          </div>
        </div>

        {/* Search input */}
        <div style={{ minWidth: 260 }}>
          <input
            type="text"
            placeholder="Qidiruv (nomi, format yoki bo‘lim)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ fontSize: "0.8rem", padding: "0.45rem 0.75rem" }}
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="admin-empty-state">
          <p>Cloudinary fayllari yuklanmoqda...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="admin-empty-state">
          <p>Hech qanday fayl topilmadi.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredAssets.map((asset) => {
            const isDeleting = deletingId === asset.public_id;
            const isCopied = copiedId === asset.public_id;

            return (
              <div
                key={asset.public_id}
                className="admin-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  border: asset.is_used ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--adm-surface-border)",
                }}
              >
                {/* Media Thumbnail */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/10",
                    backgroundColor: "#13110e",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setPreviewAsset(asset)}
                  title="Kattalashtirib ko‘rish"
                >
                  {asset.resource_type === "video" ? (
                    <>
                      <video
                        src={asset.secure_url}
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.3)",
                        }}
                      >
                        <span
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.65)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            paddingLeft: "3px",
                            border: "1px solid rgba(255,255,255,0.4)",
                          }}
                        >
                          ▶
                        </span>
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.secure_url}
                      alt={asset.public_id}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}

                  {/* Format tag badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      backgroundColor: "rgba(0, 0, 0, 0.75)",
                      color: "#ffffff",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "0.15rem 0.45rem",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {asset.format || asset.resource_type}
                  </div>

                  {/* Usage Status Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: asset.is_used ? "#059669" : "rgba(0, 0, 0, 0.65)",
                      color: "#ffffff",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      padding: "0.15rem 0.5rem",
                      border: asset.is_used ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    {asset.is_used ? "● Saytda faol" : "Ishlatilmayapti"}
                  </div>
                </div>

                {/* Card Info & Usage */}
                <div style={{ padding: "0.75rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--adm-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={asset.public_id}
                  >
                    {asset.public_id}
                  </div>

                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--adm-text-muted)",
                      marginTop: "0.2rem",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{formatBytes(asset.bytes)}</span>
                    {asset.width && asset.height && (
                      <span>
                        {asset.width} × {asset.height}
                      </span>
                    )}
                  </div>

                  {/* Where it is used */}
                  {asset.is_used && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.4rem 0.5rem",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        fontSize: "0.68rem",
                        color: "#166534",
                        borderRadius: "2px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "0.15rem" }}>
                        Qayerda ishlatilmoqda:
                      </strong>
                      <div style={{ maxHeight: 42, overflowY: "auto", lineHeight: "1.25" }}>
                        {asset.used_in.map((u, i) => (
                          <div key={i}>• {u}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!asset.is_used && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.35rem 0.5rem",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        fontSize: "0.68rem",
                        color: "var(--adm-text-muted)",
                      }}
                    >
                      Ushbu fayl hozir hech qayerda ulanmagan. Bemalol o‘chirishingiz mumkin.
                    </div>
                  )}

                  {/* Card Actions Bar */}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                      borderTop: "1px solid var(--adm-surface-border)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => copyToClipboard(asset.secure_url, asset.public_id)}
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                      title="URL manzilidan nusxa olish"
                    >
                      {isCopied ? "✓ Nusxalandi" : "Nusxa olish"}
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(asset)}
                      className="admin-btn admin-btn--danger admin-btn--sm"
                      style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                      title="Cloudinary'dan o‘chirish"
                    >
                      {isDeleting ? "..." : "O‘chirish"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewAsset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setPreviewAsset(null)}
        >
          <div
            style={{
              maxWidth: 900,
              width: "100%",
              backgroundColor: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderBottom: "1px solid var(--adm-surface-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.85rem" }}>{previewAsset.public_id}</strong>
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.7rem",
                    color: "var(--adm-text-muted)",
                  }}
                >
                  ({previewAsset.format} • {formatBytes(previewAsset.bytes)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "var(--adm-text-primary)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Media Content */}
            <div
              style={{
                maxHeight: "65vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0a0a0a",
                overflow: "hidden",
              }}
            >
              {previewAsset.resource_type === "video" ? (
                <video
                  src={previewAsset.secure_url}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "65vh" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAsset.secure_url}
                  alt={previewAsset.public_id}
                  style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid var(--adm-surface-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--adm-text-secondary)" }}>
                {previewAsset.is_used ? (
                  <span style={{ color: "#059669", fontWeight: 700 }}>
                    ● Saytda faol: {previewAsset.used_in.join(", ")}
                  </span>
                ) : (
                  <span>Saytda ishlatilmayapti</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(previewAsset.secure_url, previewAsset.public_id)}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                >
                  {copiedId === previewAsset.public_id ? "✓ Nusxalandi" : "URL Nusxalash"}
                </button>
                <a
                  href={previewAsset.secure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                >
                  Asl havolani ochish ↗
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(previewAsset)}
                  className="admin-btn admin-btn--danger admin-btn--sm"
                >
                  O‘chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
