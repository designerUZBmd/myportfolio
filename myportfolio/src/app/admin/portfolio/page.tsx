"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CaseItem = {
  id: string;
  title: string;
  slug: string;
  year: number;
  is_published: boolean;
  categories: {
    title: string;
  } | null;
};

export default function AdminPortfolioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CaseItem[]>([]);

  // 🔐 Auth check (ishonchli)
  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      await loadCases();
      setLoading(false);
    }

    init();
  }, [router]);

  async function loadCases() {
    const { data, error } = await supabase
      .from("portfolio_cases")
      .select(`
        id,
        title,
        slug,
        year,
        is_published,
        categories ( title )
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setItems(data || []);
    }
  }

  async function deleteCase(id: string) {
    const ok = confirm("Delete this case?");
    if (!ok) return;

    const { error } = await supabase
      .from("portfolio_cases")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  if (loading) {
    return <p>Loading admin portfolio…</p>;
  }

  return (
    <main style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Admin Portfolio</h1>

        <button onClick={() => router.push("/admin/portfolio/create")}>
          + Add case
        </button>
      </div>

      <table
        style={{
          width: "100%",
          marginTop: 24,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th align="left">Title</th>
            <th>Year</th>
            <th>Category</th>
            <th>Published</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{item.title}</td>
              <td align="center">{item.year}</td>
              <td align="center">
                {item.categories?.title || "—"}
              </td>
              <td align="center">
                {item.is_published ? "Yes" : "No"}
              </td>
              <td align="center">
                <button
                  onClick={() => router.push(`/admin/portfolio/${item.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCase(item.id)}
                  style={{ color: "red" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={5} align="center">
                No cases yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
