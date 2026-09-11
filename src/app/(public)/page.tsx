import HomeClient from "./HomeClient";
import { supabase } from "@/lib/supabase";
import { HomeSettings } from "@/types/database";

// Har bir yangilanish darhol aks etishi va Serverda (SSR) to'g'ridan-to'g'ri yuklanishi uchun
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let settings: HomeSettings | null = null;

  try {
    const { data, error } = await supabase
      .from("home_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      settings = data as HomeSettings;
    }
  } catch (err) {
    console.error("Home sahifasi sozlamalarini serverda olishda xatolik:", err);
  }

  return <HomeClient initialSettings={settings} />;
}
