import GalleryClient from "./GalleryClient";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

interface GallerySection {
  id: string;
  title: string;
  order?: number;
}

interface GalleryItemRecord {
  id: string;
  section_id: string;
  type: "image" | "video";
  url: string;
  order?: number;
  created_at?: string;
}

const getCachedGallerySectionsWithItems = unstable_cache(
  async () => {
    try {
      const [sectionsRes, itemsRes] = await Promise.all([
        supabase
          .from("gallery_sections")
          .select("id, title, order")
          .order("order", { ascending: true }),
        supabase
          .from("gallery_items")
          .select("*")
          .order("order", { ascending: true }),
      ]);

      const sections: GallerySection[] = sectionsRes.data || [];
      const items: GalleryItemRecord[] = itemsRes.data || [];

      const itemsBySection = new Map<string, GalleryItemRecord[]>();
      items.forEach((item) => {
        const list = itemsBySection.get(item.section_id) || [];
        list.push(item);
        itemsBySection.set(item.section_id, list);
      });

      return sections.map((sec) => ({
        ...sec,
        items: itemsBySection.get(sec.id) || [],
      }));
    } catch (err) {
      console.error("Failed to fetch gallery sections with items:", err);
      return [];
    }
  },
  ["gallery_sections_with_items_cache"],
  { revalidate: 60, tags: ["gallery"] }
);

export const revalidate = 60;

export default async function GalleryPage() {
  const sectionsWithItems = await getCachedGallerySectionsWithItems();
  return <GalleryClient sections={sectionsWithItems} />;
}
