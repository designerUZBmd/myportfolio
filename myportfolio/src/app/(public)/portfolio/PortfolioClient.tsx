"use client";
import { useRevealer } from "@/hooks/useRevealer";
import { useNavigation } from "@/hooks/useNavigation";

import Link from "next/link";
import Image from "next/image";

export default function PortfolioClient({
  categories,
  items,
  activeCategory,
}: {
  categories: any[];
  items: any[];
  activeCategory?: string;
}) {
  const { handleNavigation } = useNavigation();
  useRevealer();
  return (
    <>
      <div className="revealer"></div>
      <main style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1>Portfolio</h1>

        {/* Category Filter */}
        <nav style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <Link
            href="/portfolio"
            style={{
              fontWeight: !activeCategory ? "bold" : "normal",
              textDecoration: "underline",
            }}
          >
            All
          </Link>

          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;

            return (
              <Link
                key={cat.id}
                href={`/portfolio?category=${cat.slug}`}
                style={{
                  fontWeight: isActive ? "bold" : "normal",
                  textDecoration: isActive ? "underline" : "none",
                }}
              >
                {cat.title}
              </Link>
            );
          })}
        </nav>

        {/* Grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {items.map((item) => {
            const categorySlug = item.categories?.slug;

            if (!categorySlug) return null;

            return (
              <Link
                key={item.id}
                href={`/portfolio/${categorySlug}/${item.slug}`}
                onClick={handleNavigation(
                  `/portfolio/${categorySlug}/${item.slug}`,
                )}
              >
                <article>
                  <Image
                    src={item.cover_url}
                    alt={item.title}
                    width={400}
                    height={250}
                  />

                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>

                  {item.is_featured && <strong>★ Featured</strong>}
                </article>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
