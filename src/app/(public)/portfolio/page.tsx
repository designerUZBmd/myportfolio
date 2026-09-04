import PortfolioClient from "./PortfolioClient";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

const getCachedPortfolioData = unstable_cache(
  async () => {
    try {
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

      return {
        categories: categoriesRes.data || [],
        items: portfolioRes.data || [],
      };
    } catch (e) {
      console.error("Failed to fetch portfolio data:", e);
      return { categories: [], items: [] };
    }
  },
  ["portfolio_cases_data_cache"],
  { revalidate: 60, tags: ["portfolio"] }
);

export const revalidate = 60;

export default async function PortfolioPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const { categories, items } = await getCachedPortfolioData();

  return (
    <PortfolioClient
      categories={categories}
      items={items}
      activeCategory={category}
    />
  );
}
