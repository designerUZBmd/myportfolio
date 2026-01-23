import GalleryClient from "./GalleryClient";
import { supabase } from "@/lib/supabase";

async function getSections() {
  const { data } = await supabase
    .from("gallery_sections")
    .select("id, title")
    .order("order");

  return data || [];
}

async function getItemsBySection(sectionId: string) {
  const { data } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("section_id", sectionId)
    .order("order");

  return data || [];
}

export default async function GalleryPage() {
  const sections = await getSections();

  const sectionsWithItems = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      items: await getItemsBySection(section.id),
    }))
  );

  return <GalleryClient sections={sectionsWithItems} />;
}
