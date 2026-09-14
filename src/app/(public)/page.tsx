import HomeClient from "./HomeClient";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import { HomeSettings } from "@/types/database";
import { ProjectItemData } from "@/components/portfolio/ProjectList";
import { DirectionItemData } from "@/components/portfolio/DirectionsSection";
import { ClientCardData } from "@/components/portfolio/ClientsMarquee";

// ISR: Cache pre-rendered static HTML at CDN edge for 1 hour; purged instantly via revalidatePath("/")
export const revalidate = 3600;

const getCachedHomeData = unstable_cache(
  async () => {
    try {
      const [settingsRes, directionsRes, brandsRes, portfolioRes] =
        await Promise.all([
          supabase
            .from("home_settings")
            .select("*")
            .eq("id", "default")
            .maybeSingle(),
          supabase
            .from("directions")
            .select("id, number, title, description, image, order, is_active")
            .eq("is_active", true)
            .order("order", { ascending: true }),
          supabase
            .from("brands")
            .select("id, name, logo_url, height, order, is_active")
            .eq("is_active", true)
            .order("order", { ascending: true }),
          supabase
            .from("portfolio_cases")
            .select(
              `
              id,
              title,
              slug,
              year,
              cover_url,
              cover_type,
              excerpt,
              is_published,
              is_featured,
              categories ( id, title, slug )
            `
            )
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

      const settings = (settingsRes.data as HomeSettings) || null;
      const directions = (directionsRes.data as DirectionItemData[]) || [];
      const brands: ClientCardData[] = (brandsRes.data || []).map((b) => ({
        id: b.id,
        name: b.name,
        height: b.height || 240,
        logo_url: b.logo_url || "",
      }));

      const projects: ProjectItemData[] = (portfolioRes.data || []).map(
        (item) => {
          const rawCat = item.categories;
          const cat = Array.isArray(rawCat)
            ? rawCat[0]
            : (rawCat as { slug?: string; title?: string } | null);
          const categorySlug = cat?.slug || "web-design";
          const categoryTitle = cat?.title || "Design";

          return {
            id: item.id,
            title: item.title,
            category: categoryTitle,
            year: item.year ? String(item.year) : "",
            image: item.cover_url || "/images/process1.jpg",
            href: `/portfolio/${categorySlug}/${item.slug}`,
          };
        }
      );

      return { settings, directions, brands, projects };
    } catch (err) {
      console.error("Home sahifasi ma'lumotlarini serverda olishda xatolik:", err);
      return { settings: null, directions: [], brands: [], projects: [] };
    }
  },
  ["home_page_full_data_cache"],
  { revalidate: 3600, tags: ["home"] }
);

export default async function Home() {
  const { settings, directions, brands, projects } = await getCachedHomeData();

  return (
    <HomeClient
      initialSettings={settings}
      initialProjects={projects}
      initialDirections={directions}
      initialClients={brands}
    />
  );
}
