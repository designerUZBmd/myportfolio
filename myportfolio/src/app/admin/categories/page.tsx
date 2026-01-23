"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/admin/AdminGuard";

type Category = {
  id: string;
  title: string;
  slug: string;
  order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("order");

    setCategories(data || []);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("categories").insert({
      title,
      slug,
      order,
      is_active: true,
    });

    setLoading(false);

    if (!error) {
      setTitle("");
      setSlug("");
      setOrder(0);
      loadCategories();
    } else {
      alert(error.message);
    }
  }

  async function deleteCategory(id: string) {
    const ok = confirm("Delete category?");
    if (!ok) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <AdminGuard>
      <main style={{ padding: 32, maxWidth: 700 }}>
        <h1>Categories</h1>

        {/* CREATE */}
        <form onSubmit={createCategory} style={{ marginBottom: 32 }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            placeholder="Slug (web-design)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Order"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Add category"}
          </button>
        </form>

        {/* LIST */}
        <table width="100%">
          <thead>
            <tr>
              <th align="left">Title</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.title}</td>
                <td align="center">{cat.slug}</td>
                <td align="center">{cat.order}</td>
                <td align="center">
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    style={{ color: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td colSpan={4} align="center">
                  No categories
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </AdminGuard>
  );
}
