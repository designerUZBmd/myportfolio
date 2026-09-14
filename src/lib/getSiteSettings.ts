import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export type SiteSettings = {
  favicon_url: string;
  title_rotation_enabled: boolean;
  title_rotation_interval: number;
  title_words: string[];
};

const DEFAULT_SETTINGS: SiteSettings = {
  favicon_url: "",
  title_rotation_enabled: true,
  title_rotation_interval: 2.5,
  title_words: ["Obloqulov", "Digital Designer", "Creative Developer"],
};

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "siteSettings.json"
);

export function readLocalSettingsFile(): SiteSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        favicon_url:
          typeof parsed.favicon_url === "string" ? parsed.favicon_url.trim() : "",
        title_rotation_enabled:
          parsed.title_rotation_enabled !== undefined
            ? Boolean(parsed.title_rotation_enabled)
            : true,
        title_rotation_interval:
          Number(parsed.title_rotation_interval) || 2.5,
        title_words:
          Array.isArray(parsed.title_words) && parsed.title_words.length > 0
            ? parsed.title_words.filter(
                (w: unknown) => typeof w === "string" && w.trim().length > 0
              )
            : DEFAULT_SETTINGS.title_words,
      };
    }
  } catch (err) {
    console.error("Error reading siteSettings.json:", err);
  }
  return DEFAULT_SETTINGS;
}

export function writeLocalSettingsFile(data: SiteSettings) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      SETTINGS_FILE_PATH,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Error writing siteSettings.json:", err);
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const local = readLocalSettingsFile();

  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://bwuelpuepfmptrekvejc.supabase.co";
  const supabaseUrl = rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    return local;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("home_settings")
      .select("favicon_url, title_words, title_rotation_enabled, title_rotation_interval")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const dbFavicon = data.favicon_url;
      const dbWords = data.title_words;
      const dbEnabled = data.title_rotation_enabled;
      const dbInterval = data.title_rotation_interval;

      return {
        favicon_url:
          typeof dbFavicon === "string" && dbFavicon.trim().length > 0
            ? dbFavicon.trim()
            : local.favicon_url,
        title_rotation_enabled:
          dbEnabled !== undefined && dbEnabled !== null
            ? Boolean(dbEnabled)
            : local.title_rotation_enabled,
        title_rotation_interval:
          Number(dbInterval) || local.title_rotation_interval,
        title_words:
          Array.isArray(dbWords) && dbWords.length > 0
            ? dbWords
            : local.title_words,
      };
    }
  } catch {
    // If Supabase table columns don't exist yet, return local file settings
  }

  return local;
}
