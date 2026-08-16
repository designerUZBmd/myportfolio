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

export const revalidate = 60;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("portfolio_cases")
    .select("slug, categories ( slug )")
    .eq("is_published", true);

  if (!data) return [];

  return data
    .filter((item: any) => item.categories?.slug && item.slug)
    .map((item: any) => ({
      category: item.categories.slug,
      slug: item.slug,
    }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params; // 👈 MUHIM

  const item = await getCase(slug);

  if (!item) return <h1>Case not found</h1>;

  return <CaseClient item={item} />;
}
