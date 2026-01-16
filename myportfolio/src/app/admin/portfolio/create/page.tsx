"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  _id: string;
  title: string;
  slug: string;
};

export default function CreatePortfolioPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);


  const [form, setForm] = useState({
    title: "",
    slug: "",
    categorySlug: "",
    coverImageUrl: "",
    excerpt: "",
    description: "",
    year: new Date().getFullYear(),
  });

  // Category’larni olish
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  if (!e.target.files?.[0]) return;

  const formData = new FormData();
  formData.append("file", e.target.files[0]);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  setForm((prev) => ({
    ...prev,
    coverImageUrl: data.url,
  }));
}

const [isFeatured, setIsFeatured] = useState(false);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        categorySlug: form.categorySlug,
        coverMedia: {
          type: "image",
          url: form.coverImageUrl,
        },
        gallery,
        excerpt: form.excerpt,
        description: form.description,
        year: Number(form.year),
        sections,
        isFeatured,
      }),
    });

    setLoading(false);

    if (res.ok) {
      alert("Case created ✅");
      router.push("/admin/portfolio");
    } else {
      alert("Error creating case ❌");
    }
  }

  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >([]);

  function addSection() {
    setSections([...sections, { title: "", content: "" }]);
  }

  function updateSection(index: number, field: string, value: string) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  const [gallery, setGallery] = useState<
    { type: "image" | "video"; url: string }[]
  >([]);

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
        {
          type: data.type === "video" ? "video" : "image",
          url: data.url,
        },
      ]);
    }
  }



  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Add New Case</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <input
          name="slug"
          placeholder="Slug (saas-landing-page)"
          value={form.slug}
          onChange={handleChange}
          required
        />

        <select
          name="categorySlug"
          value={form.categorySlug}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.title}
            </option>
          ))}
        </select>

        <input
          name="coverImageUrl"
          placeholder="Cover image URL"
          value={form.coverImageUrl}
          onChange={handleChange}
          required
        />

        <textarea
          name="excerpt"
          placeholder="Short excerpt"
          value={form.excerpt}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Full description"
          value={form.description}
          onChange={handleChange}
        />

        <input type="file" onChange={handleFileUpload} />

        <input
          name="year"
          type="number"
          value={form.year}
          onChange={handleChange}
        />

        <h3>Case Sections</h3>

      {sections.map((section, i) => (
        <div key={i}>
          <input
            placeholder="Section title (e.g. Problem)"
            value={section.title}
            onChange={(e) =>
              updateSection(i, "title", e.target.value)
            }
          />

          <textarea
            placeholder="Section content"
            value={section.content}
            onChange={(e) =>
              updateSection(i, "content", e.target.value)
            }
          />

          <button type="button" onClick={() => removeSection(i)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={addSection}>
        + Add Section
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

      <label>
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        Featured case
      </label>


      <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Case"}
      </button>
      </form>
    </div>
  );
}
