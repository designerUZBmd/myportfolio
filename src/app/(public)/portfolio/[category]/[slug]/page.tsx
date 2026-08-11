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

export default async function Page({ params }: Props) {
  const { slug } = await params; // 👈 MUHIM

  const item = await getCase(slug);

  if (!item) return <h1>Case not found</h1>;

  return <CaseClient item={item} />;
}
