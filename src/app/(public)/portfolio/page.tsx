import PortfolioClient from "./PortfolioClient";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

async function fetchFreshPortfolioData() {
  const [categoriesRes, portfolioRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("order"),
    supabase
      .from("portfolio_cases")
      .select(
        `
        *,
        categories ( title, slug )
      `
      )
      .eq("is_published", true)
      .order("year", { ascending: false }),
  ]);

  if (portfolioRes.error) {
    console.error("Supabase portfolio_cases fetch error:", portfolioRes.error);
  }

  return {
    categories: categoriesRes.data || [],
    items: portfolioRes.data || [],
  };
}

const getCachedPortfolioData = unstable_cache(
  async () => {
    try {
      const data = await fetchFreshPortfolioData();
      // If no items returned due to an error, don't poison the cache with empty array
      return data;
    } catch (e) {
      console.error("Failed to fetch portfolio data:", e);
      return { categories: [], items: [] };
    }
  },
  ["portfolio_cases_data_cache"],
  { revalidate: 3600, tags: ["portfolio"] }
);

export const revalidate = 3600;

export default async function PortfolioPage({ searchParams }: Props) {
  const { category } = await searchParams;
  let { categories, items } = await getCachedPortfolioData();

  // Agar kesh tasodifan bo'sh bo'lib qolgan bo'lsa, zaxira sifatida to'g'ridan-to'g'ri yangi ma'lumotni yuklash
  if (!items || items.length === 0) {
    try {
      const fresh = await fetchFreshPortfolioData();
      if (fresh.items && fresh.items.length > 0) {
        categories = fresh.categories;
        items = fresh.items;
      }
    } catch (fallbackErr) {
      console.error("Fresh fetch fallback failed:", fallbackErr);
    }
  }

  return (
    <PortfolioClient
      categories={categories}
      items={items}
      activeCategory={category}
    />
  );
}
