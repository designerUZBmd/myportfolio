import PortfolioClient from "./PortfolioClient";
import { supabase } from "@/lib/supabase";

type Props = {
  searchParams: {
    category?: string;
  };
};

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("order");

  return data || [];
}

async function getPortfolio(category?: string) {
  let query = supabase
    .from("portfolio_cases")
    .select(
      `
      *,
      categories ( title, slug )
    `
    )
    .eq("is_published", true)
    .order("year", { ascending: false });

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  const { data } = await query;
  return data || [];
}

export default async function PortfolioPage({ searchParams }: Props) {
  const category = searchParams.category;

  const categories = await getCategories();
  const items = await getPortfolio(category);

  return (
    <PortfolioClient
      categories={categories}
      items={items}
      activeCategory={category}
    />
  );
}
