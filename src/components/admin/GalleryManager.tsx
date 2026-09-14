"use client";

import React, { useRef } from "react";

export type GalleryItem = {
  type: "image" | "video";
  url: string;
};

interface GalleryManagerProps {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GalleryManager({
  items,
  onChange,
  uploading,
  onUpload,
}: GalleryManagerProps) {
  const draggedIndexRef = useRef<number | null>(null);

  // Drag and drop handlers using Ref to avoid Chrome cancel-on-rerender bug
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    draggedIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));

    const element = e.currentTarget;
    setTimeout(() => {
      element.classList.add("is-dragging");
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("is-drag-over");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("is-drag-over");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("is-drag-over");

    const textData = e.dataTransfer.getData("text/plain");
    const fromIndex =
      draggedIndexRef.current !== null
        ? draggedIndexRef.current
        : textData !== ""
        ? parseInt(textData, 10)
        : null;

    if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== targetIndex) {
      const updated = [...items];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(targetIndex, 0, removed);
      onChange(updated);
    }

    draggedIndexRef.current = null;
    cleanupDragClasses();
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    cleanupDragClasses();
  };

  const cleanupDragClasses = () => {
    if (typeof document !== "undefined") {
      document.querySelectorAll(".admin-gallery-item").forEach((el) => {
        el.classList.remove("is-dragging", "is-drag-over");
      });
    }
  };

  // Move item left / right
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    onChange(updated);
  };

  // Reverse list order
  const handleReverse = () => {
    if (items.length <= 1) return;
    onChange([...items].reverse());
  };

  // Remove single item
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  // Remove all items
  const handleClearAll = () => {
    if (items.length === 0) return;
    if (confirm("Haqiqatan ham barcha yuklangan galereya fayllarini o‘chirmoqchimisiz?")) {
      onChange([]);
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
              color: "var(--adm-text-primary)",
            }}
          >
            4. Keys Galereyasi ({items.length} ta fayl)
          </h2>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--adm-text-secondary)",
              margin: "0.25rem 0 0",
            }}
          >
            Saytda rasm va videolar aynan <strong>№1</strong> dan boshlab ketma-ket chiqadi.
          </p>
        </div>

        {items.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleReverse}
              className="admin-btn admin-btn--secondary admin-btn--sm"
              style={{ fontSize: "0.72rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              title="Ketma-ketlikni boshdan-oyoq teskari o‘girish"
            >
              <span>⇄</span> Teskari o‘girish
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="admin-btn admin-btn--secondary admin-btn--sm"
              style={{ fontSize: "0.72rem", padding: "0.35rem 0.65rem", color: "var(--adm-danger)" }}
              title="Barcha galereya fayllarini o‘chirish"
            >
              Tozalash
            </button>
          </div>
        )}
      </div>

      {/* Helper Guide */}
      <div
        style={{
          backgroundColor: "#f7f7f8",
          border: "1px dashed var(--adm-surface-border)",
          padding: "0.5rem 0.75rem",
          marginBottom: "1rem",
          fontSize: "0.72rem",
          color: "var(--adm-text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span>
          💡 <strong>Tartiblash:</strong> Rasmni sichqoncha bilan <strong>ushlab surishingiz (drag & drop)</strong> yoki kartochkadagi <strong>◀ ▶</strong> strelkalar orqali oldinga/orqaga surishingiz mumkin.
        </span>
      </div>

      {/* Upload Dropzone */}
      <label className="admin-dropzone" style={{ display: "block", cursor: uploading ? "wait" : "pointer" }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--adm-text-primary)",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {uploading ? "Yuklanmoqda..." : "+ Rasm yoki video tanlang (Ko‘p tanlash mumkin)"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--adm-text-secondary)", marginTop: "0.25rem" }}>
          JPG, PNG, WEBP, MP4 formatlar qo‘llab-quvvatlanadi
        </div>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {/* Gallery Reorderable Grid */}
      {items.length > 0 && (
        <div className="admin-gallery-grid" style={{ marginTop: "1.25rem" }}>
          {items.map((item, i) => {
            const isFirst = i === 0;
            const isLast = i === items.length - 1;

            return (
              <div
                key={item.url || String(i)}
                className="admin-gallery-item"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                title={`№${i + 1} rasm. Ushlab surib boshqa joyga qo‘yishingiz mumkin.`}
              >
                {/* Order Badge */}
                <div
                  className="admin-gallery-badge"
                  style={{
                    backgroundColor: isFirst ? "#000000" : "rgba(0, 0, 0, 0.75)",
                    color: "#ffffff",
                    borderColor: isFirst ? "#ffffff" : "transparent",
                  }}
                >
                  {isFirst ? "№1 (Boshida)" : `№${i + 1}`}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  className="admin-gallery-delete"
                  onClick={() => handleRemove(i)}
                  title="O‘chirish"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  ✕
                </button>

                {/* Media Item */}
                <div className="admin-gallery-media-wrap">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={`Gallery item ${i + 1}`}
                      draggable={false}
                    />
                  ) : (
                    <video
                      src={item.url}
                      muted
                      playsInline
                      draggable={false}
                    />
                  )}
                </div>

                {/* Drag Handle Indicator */}
                <div className="admin-gallery-drag-indicator">
                  <span>⠿ Ushlab surish</span>
                </div>

                {/* Action Controls Bar (Bottom) */}
                <div
                  className="admin-gallery-controls"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveItem(i, i - 1)}
                    className="admin-gallery-ctrl-btn"
                    title="Oldinga (chapga) surish"
                  >
                    ◀
                  </button>

                  <span className="admin-gallery-type-tag">
                    {item.type === "video" ? "VIDEO" : "IMG"}
                  </span>

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveItem(i, i + 1)}
                    className="admin-gallery-ctrl-btn"
                    title="Keyinga (o‘ngga) surish"
                  >
                    ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
