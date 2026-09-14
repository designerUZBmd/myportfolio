"use client";

import React, { useState } from "react";
import CloudinaryMediaModal, {
  SelectedMediaItem,
} from "@/components/admin/CloudinaryMediaModal";

interface MediaInputWithPickerProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  mediaType?: "all" | "image" | "video";
  placeholder?: string;
  helperText?: string;
  aspectRatio?: string;
}

export default function MediaInputWithPicker({
  label,
  value,
  onChange,
  mediaType = "image",
  placeholder = "https://res.cloudinary.com/...",
  helperText,
  aspectRatio = "16/10",
}: MediaInputWithPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Quick direct file upload from PC
  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Fayl yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleModalSelect(items: SelectedMediaItem[]) {
    if (items.length > 0) {
      onChange(items[0].url);
    }
  }

  const isVideo =
    value.endsWith(".mp4") ||
    value.endsWith(".webm") ||
    value.includes("/video/upload/");

  return (
    <div className="admin-form-group" style={{ marginBottom: "1.25rem" }}>
      {label && <label className="admin-form-label">{label}</label>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: value ? "180px 1fr" : "1fr",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        {/* Preview box if value exists */}
        {value && (
          <div
            style={{
              position: "relative",
              border: "1px solid var(--adm-surface-border)",
              backgroundColor: "#13110e",
              overflow: "hidden",
            }}
          >
            <div style={{ width: "100%", aspectRatio, position: "relative" }}>
              {isVideo ? (
                <video
                  src={value}
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={() => onChange("")}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "#000",
                color: "#fff",
                border: "none",
                width: 22,
                height: 22,
                cursor: "pointer",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Tozalash"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input & Action Buttons */}
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="admin-btn admin-btn--primary admin-btn--sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <span>🖼 Cloudinary’dan tanlash</span>
            </button>

            <label
              className="admin-btn admin-btn--secondary admin-btn--sm"
              style={{
                cursor: uploading ? "wait" : "pointer",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>{uploading ? "⏳ Yuklanmoqda..." : "⬆ Fayl yuklash"}</span>
              <input
                type="file"
                accept={mediaType === "video" ? "video/*" : mediaType === "image" ? "image/*" : "image/*,video/*"}
                onChange={handleQuickUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <input
            type="url"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="admin-input"
            style={{ fontSize: "0.82rem" }}
          />

          {helperText && (
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--adm-text-muted)",
                margin: "0.3rem 0 0",
              }}
            >
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Cloudinary Picker Modal */}
      <CloudinaryMediaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleModalSelect}
        multiple={false}
        mediaType={mediaType}
        title={label ? `${label} - Cloudinary` : "Cloudinary Media Tanlash"}
      />
    </div>
  );
}
