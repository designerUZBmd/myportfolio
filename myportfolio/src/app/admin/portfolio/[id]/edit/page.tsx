"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  title: string;
};

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >([]);

  const [gallery, setGallery] = useState<
    { type: "image" | "video"; url: string }[]
  >([]);

  // 🔐 auth + data load
  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      // categories
      const { data: catData } = await supabase
        .from("categories")
        .select("id, title")
        .order("order");

      setCategories(catData || []);

      // case data
      const { data, error } = await supabase
        .from("portfolio_cases")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Case not found");
        router.replace("/admin/portfolio");
        return;
      }

      // fill form
      setTitle(data.title);
      setSlug(data.slug);
      setCategoryId(data.category_id);
      setCoverUrl(data.cover_url);
      setExcerpt(data.excerpt);
      setDescription(data.description);
      setYear(data.year);
      setIsPublished(data.is_published);
      setIsFeatured(data.is_featured);
      setSections(data.sections || []);
      setGallery(data.gallery || []);

      setLoading(false);
    }

    init();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase
      .from("portfolio_cases")
      .update({
        title,
        slug,
        category_id: categoryId,
        cover_url: coverUrl,
        excerpt,
        description,
        year,
        is_published: isPublished,
        is_featured: isFeatured,
        sections,
        gallery,
      })
      .eq("id", id);

    if (error) {
      alert("Update failed");
      console.error(error);
    } else {
      alert("Case updated ✅");
      router.push("/admin/portfolio");
    }
  }

  if (loading) return <p>Loading case…</p>;

  return (
    <main style={{ maxWidth: 700, padding: 32 }}>
      <h1>Edit Case</h1>

      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Cover URL" />
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input type="number" value={year} onChange={(e) => setYear(+e.target.value)} />

        <label>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <label>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured
        </label>

        <button type="submit">Save changes</button>
      </form>
    </main>
  );
}
