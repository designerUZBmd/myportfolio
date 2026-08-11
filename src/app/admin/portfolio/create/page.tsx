"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/admin/AdminGuard";

type Category = {
  id: string;
  title: string;
};

export default function CreatePortfolioPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [isFeatured, setIsFeatured] = useState(false);

  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >([]);

  const [gallery, setGallery] = useState<
    { type: "image" | "video"; url: string }[]
  >([]);

  // ✅ categories from Supabase
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, title")
        .eq("is_active", true)
        .order("order");

      setCategories(data || []);
    }

    loadCategories();
  }, []);

  // ✅ Cloudinary upload qoladi
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setCoverUrl(data.url);
  }

  async function handleGalleryUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files?.length) return;

    const files = Array.from(e.target.files);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setGallery((prev) => [
        ...prev,
        { type: data.type === "video" ? "video" : "image", url: data.url },
      ]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!categoryId) {
      alert("Category required");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("portfolio_cases")
      .insert({
        title,
        slug,
        category_id: categoryId,
        cover_type: "image",
        cover_url: coverUrl,
        excerpt,
        description,
        year,
        gallery,
        sections,
        is_featured: isFeatured,
        is_published: true,
      });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error creating case");
    } else {
      alert("Case created ✅");
      router.push("/portfolio");
    }
  }

  return (
    <AdminGuard>
    <div style={{ maxWidth: 600 }}>
      <h1>Add New Case</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.title}</option>
          ))}
        </select>

        <input placeholder="Cover URL" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        <input type="file" onChange={handleFileUpload} />

        <textarea placeholder="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <h3>Case Sections</h3>

        {sections.map((section, i) => (
          <div key={i} style={{ border: "1px solid #ccc", padding: 10 }}>
            <input
              placeholder="Section title (e.g. Problem)"
              value={section.title}
              onChange={(e) => {
                const copy = [...sections];
                copy[i].title = e.target.value;
                setSections(copy);
              }}
            />

            <textarea
              placeholder="Section content"
              value={section.content}
              onChange={(e) => {
                const copy = [...sections];
                copy[i].content = e.target.value;
                setSections(copy);
              }}
            />

            <button type="button" onClick={() =>
              setSections(sections.filter((_, idx) => idx !== i))
            }>
              Remove section
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setSections([...sections, { title: "", content: "" }])}
        >
          + Add section
        </button>

        <h3>Gallery</h3>

        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleGalleryUpload}
        />

        <div style={{ display: "grid", gap: 10 }}>
          {gallery.map((item, i) => (
            <div key={i}>
              {item.type === "image" ? (
                <img src={item.url} width={120} />
              ) : (
                <video src={item.url} width={120} controls />
              )}

              <button
                type="button"
                onClick={() =>
                  setGallery(gallery.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>



        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />

        <label>
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Case"}
        </button>
      </form>
    </div>
    </AdminGuard>
  );
}
