"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/admin/AdminGuard";

type Section = {
  id: string;
  title: string;
};

type Item = {
  id: string;
  type: "image" | "video";
  url: string;
};

export default function AdminGalleryPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    const { data } = await supabase
      .from("gallery_sections")
      .select("*")
      .order("order");
    setSections(data || []);
  }

  async function createSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle) return;

    await supabase.from("gallery_sections").insert({ title: newTitle });
    setNewTitle("");
    loadSections();
  }

  async function uploadMedia(
    sectionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files?.length) return;

    for (const file of Array.from(e.target.files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      await supabase.from("gallery_items").insert({
        section_id: sectionId,
        type: data.type === "video" ? "video" : "image",
        url: data.url,
      });
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("gallery_items").delete().eq("id", id);
  }

  return (
    <AdminGuard>
      <main style={{ padding: 32, maxWidth: 900 }}>
        <h1>Gallery (Admin)</h1>

        {/* Add section */}
        <form onSubmit={createSection}>
          <input
            placeholder="Section title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit">Add section</button>
        </form>

        {/* Sections */}
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            onUpload={uploadMedia}
            onDelete={deleteItem}
          />
        ))}
      </main>
    </AdminGuard>
  );
}

function SectionBlock({
  section,
  onUpload,
  onDelete,
}: {
  section: Section;
  onUpload: any;
  onDelete: any;
}) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("*")
      .eq("section_id", section.id)
      .then(({ data }) => setItems(data || []));
  }, [section.id]);

  return (
    <section style={{ marginTop: 32 }}>
      <h3>{section.title}</h3>

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => onUpload(section.id, e)}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map((item) => (
          <div key={item.id}>
            {item.type === "image" ? (
              <img src={item.url} width={120} />
            ) : (
              <video src={item.url} width={120} controls />
            )}
            <button onClick={() => onDelete(item.id)}>✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}
