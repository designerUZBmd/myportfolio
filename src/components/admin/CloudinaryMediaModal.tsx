"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { CloudinaryAsset } from "@/app/api/admin/cloudinary/route";

export type SelectedMediaItem = {
  url: string;
  type: "image" | "video";
  public_id?: string;
};

interface CloudinaryMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: SelectedMediaItem[]) => void;
  multiple?: boolean;
  mediaType?: "all" | "image" | "video";
  title?: string;
}

export default function CloudinaryMediaModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  mediaType = "all",
  title = "Cloudinary Media Tanlash",
}: CloudinaryMediaModalProps) {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">(mediaType);
  const [selectedUrls, setSelectedUrls] = useState<Map<string, SelectedMediaItem>>(new Map());

  // Direct upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load assets when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    async function loadAssets() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/admin/cloudinary", { headers });
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
      } catch (err) {
        console.error("Modal load error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAssets();
    setSelectedUrls(new Map());
    setSearchQuery("");
    setSelectedType(mediaType);

    return () => {
      ignore = true;
    };
  }, [isOpen, mediaType]);

  // Handle direct file upload from computer
  async function handleDirectUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newItems: SelectedMediaItem[] = [];
      const newAssets: CloudinaryAsset[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          const itemType = data.type === "video" ? "video" : "image";
          const mediaItem: SelectedMediaItem = {
            url: data.url,
            type: itemType,
            public_id: data.public_id || file.name,
          };
          newItems.push(mediaItem);

          // Add to local assets list for immediate display
          newAssets.push({
            public_id: data.public_id || file.name,
            format: file.name.split(".").pop() || "",
            version: Date.now(),
            resource_type: itemType,
            type: "upload",
            created_at: new Date().toISOString(),
            bytes: file.size,
            url: data.url,
            secure_url: data.url,
            is_used: false,
            used_in: [],
          });
        }
      }

      // Prepend newly uploaded assets
      if (newAssets.length > 0) {
        setAssets((prev) => [...newAssets, ...prev]);

        // Auto select newly uploaded
        if (multiple) {
          setSelectedUrls((prev) => {
            const next = new Map(prev);
            newItems.forEach((item) => next.set(item.url, item));
            return next;
          });
        } else if (newItems.length > 0) {
          const single = new Map();
          single.set(newItems[0].url, newItems[0]);
          setSelectedUrls(single);
        }
      }
    } catch (err) {
      console.error("Direct upload error:", err);
      alert("Fayl yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Toggle selection
  function toggleSelect(asset: CloudinaryAsset) {
    const item: SelectedMediaItem = {
      url: asset.secure_url,
      type: asset.resource_type,
      public_id: asset.public_id,
    };

    if (multiple) {
      setSelectedUrls((prev) => {
        const next = new Map(prev);
        if (next.has(asset.secure_url)) {
          next.delete(asset.secure_url);
        } else {
          next.set(asset.secure_url, item);
        }
        return next;
      });
    } else {
      // Single select: toggle or replace
      setSelectedUrls((prev) => {
        const next = new Map();
        if (!prev.has(asset.secure_url)) {
          next.set(asset.secure_url, item);
        }
        return next;
      });
    }
  }

  // Confirm selection
  function handleConfirm() {
    const items = Array.from(selectedUrls.values());
    if (items.length === 0) return;
    onSelect(items);
    onClose();
  }

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (selectedType !== "all" && a.resource_type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = a.public_id.toLowerCase().includes(q);
        const m2 = a.format?.toLowerCase().includes(q);
        return m1 || m2;
      }
      return true;
    });
  }, [assets, selectedType, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1080,
          height: "88vh",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Bar */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--adm-surface-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
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
              {title}
            </h2>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--adm-text-secondary)",
                margin: "0.2rem 0 0",
              }}
            >
              Cloudinary’dagi mavjud fayllardan tanlang yoki kompyuterdan yangi fayl yuklang
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "var(--adm-text-primary)",
              lineHeight: 1,
              padding: "0.25rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. Controls / Upload Toolbar */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid var(--adm-surface-border)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Type Filters & Search */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {mediaType === "all" && (
              <div style={{ display: "flex", border: "1px solid var(--adm-surface-border)", backgroundColor: "#fff" }}>
                <button
                  type="button"
                  onClick={() => setSelectedType("all")}
                  style={{
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: selectedType === "all" ? "var(--adm-text-primary)" : "transparent",
                    color: selectedType === "all" ? "#fff" : "var(--adm-text-secondary)",
                  }}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("image")}
                  style={{
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: selectedType === "image" ? "var(--adm-text-primary)" : "transparent",
                    color: selectedType === "image" ? "#fff" : "var(--adm-text-secondary)",
                  }}
                >
                  Rasmlar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("video")}
                  style={{
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: selectedType === "video" ? "var(--adm-text-primary)" : "transparent",
                    color: selectedType === "video" ? "#fff" : "var(--adm-text-secondary)",
                  }}
                >
                  Videolar
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Qidirish (fayl nomi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem", width: 200 }}
            />
          </div>

          {/* Right: Direct upload from PC */}
          <div>
            <label
              className="admin-btn admin-btn--primary admin-btn--sm"
              style={{
                cursor: uploading ? "wait" : "pointer",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>{uploading ? "⏳ Yuklanmoqda..." : "⬆ Kompyuterdan yuklash"}</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={
                  mediaType === "image"
                    ? "image/*"
                    : mediaType === "video"
                    ? "video/*"
                    : "image/*,video/*"
                }
                onChange={handleDirectUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {/* 3. Media Grid Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            backgroundColor: "#ffffff",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--adm-text-muted)" }}>
              Fayllar yuklanmoqda...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--adm-text-muted)" }}>
              Hech qanday fayl topilmadi. Yuqoridagi tugma orqali kompyuteringizdan yangi fayl yuklashingiz mumkin.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "0.9rem",
              }}
            >
              {filteredAssets.map((asset) => {
                const isSelected = selectedUrls.has(asset.secure_url);

                return (
                  <div
                    key={asset.public_id}
                    onClick={() => toggleSelect(asset)}
                    style={{
                      border: isSelected
                        ? "2px solid #000000"
                        : "1px solid var(--adm-surface-border)",
                      backgroundColor: isSelected ? "#f9fafb" : "#ffffff",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16/10",
                        backgroundColor: "#13110e",
                        position: "relative",
                        overflow: "hidden",
                      }}
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
                              backgroundColor: "rgba(0,0,0,0.25)",
                            }}
                          >
                            <span
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0.65)",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                paddingLeft: "2px",
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

                      {/* Format Badge */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          backgroundColor: "rgba(0,0,0,0.75)",
                          color: "#fff",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.35rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {asset.format || asset.resource_type}
                      </div>

                      {/* Selection Badge Checkmark */}
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "#000000" : "rgba(255, 255, 255, 0.8)",
                          border: isSelected ? "2px solid #ffffff" : "1px solid rgba(0,0,0,0.3)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                        }}
                      >
                        {isSelected ? "✓" : ""}
                      </div>

                      {/* Active Site Badge */}
                      {asset.is_used && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            backgroundColor: "#059669",
                            color: "#fff",
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.35rem",
                          }}
                        >
                          ● Faol
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div style={{ padding: "0.45rem 0.55rem" }}>
                      <div
                        style={{
                          fontSize: "0.68rem",
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Modal Footer Bar */}
        <div
          style={{
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid var(--adm-surface-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--adm-text-secondary)" }}>
            Tanlandi: <strong>{selectedUrls.size}</strong> ta fayl
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn--secondary"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.size === 0}
              className="admin-btn admin-btn--primary"
            >
              Tanlash {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
