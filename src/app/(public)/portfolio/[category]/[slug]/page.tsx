import CaseClient from "./CaseClient";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

async function getCase(slug: string) {
  const { data } = await supabase
    .from("portfolio_cases")
    .select(`*, categories ( title, slug )`)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return data;
}

async function getNextCase(currentSlug: string) {
  const { data } = await supabase
    .from("portfolio_cases")
    .select(`id, slug, title, categories ( title, slug )`)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!data || data.length <= 1) return null;

  const currentIndex = data.findIndex((c) => c.slug === currentSlug);
  if (currentIndex === -1) return null;

  const nextIndex = (currentIndex + 1) % data.length;
  return data[nextIndex];
}

export const revalidate = 60;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("portfolio_cases")
    .select("slug, categories ( slug )")
    .eq("is_published", true);

  if (!data) return [];

  const results: { category: string; slug: string }[] = [];

  for (const item of data) {
    const rawCat = item.categories;
    const catSlug = Array.isArray(rawCat)
      ? rawCat[0]?.slug
      : (rawCat as { slug?: string } | null)?.slug;

    if (catSlug && item.slug) {
      results.push({
        category: catSlug,
        slug: item.slug,
      });
    }
  }

  return results;
}

export default async function Page({ params }: Props) {
  const { slug } = await params; // 👈 MUHIM

  const item = await getCase(slug);

  if (!item) return <h1>Case not found</h1>;

  const nextCase = await getNextCase(slug);

  return <CaseClient item={item} nextCase={nextCase} />;
}
