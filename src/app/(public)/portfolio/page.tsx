import PortfolioClient from "./PortfolioClient";
import { supabase } from "@/lib/supabase";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

async function getCategories() {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("order");

  return data || [];
}

async function getPortfolio() {
  const { data } = await supabase
    .from("portfolio_cases")
    .select(
      `
      *,
      categories ( title, slug )
    `
    )
    .eq("is_published", true)
    .order("year", { ascending: false });

  return data || [];
}

export const revalidate = 60;

export default async function PortfolioPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const [categories, items] = await Promise.all([
    getCategories(),
    getPortfolio(),
  ]);

  return (
    <PortfolioClient
      categories={categories}
      items={items}
      activeCategory={category}
    />
  );
}
