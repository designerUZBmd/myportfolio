import Link from "next/link";
import Image from "next/image";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

async function getCategories() {
  const res = await fetch("http://localhost:3000/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

async function getPortfolio(category?: string) {
  const url = category
    ? `http://localhost:3000/api/portfolio?category=${category}`
    : `http://localhost:3000/api/portfolio`;

  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

export default async function PortfolioPage({ searchParams }: Props) {
  // 🔥 Next.js 15 — searchParams ham Promise
  const { category } = await searchParams;

  const categories = await getCategories();
  const items = await getPortfolio(category);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1>Portfolio</h1>

      {/* Category Filter */}
      <nav style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <Link
          href="/portfolio"
          style={{
            fontWeight: !category ? "bold" : "normal",
            textDecoration: "underline",
          }}
        >
          All
        </Link>

        {categories.map((cat: any) => {
          const isActive = category === cat.slug;

          return (
            <Link
              key={cat._id}
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
        {items.map((item: any) => (
          <Link
            key={item._id}
            href={`/portfolio/${item.category.slug}/${item.slug}`}
          >
            <article>
              <Image
                src={item.coverMedia.url}
                alt={item.title}
                width={400}
                height={250}
              />

              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>

              {item.isFeatured && <strong>★ Featured</strong>}
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
