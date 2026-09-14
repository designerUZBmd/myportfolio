import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

function getSupabaseServerClient(req: NextRequest) {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://bwuelpuepfmptrekvejc.supabase.co";
  const supabaseUrl = rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const supabaseKey = serviceKey || anonKey;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          req.cookies.set(name, value)
        );
      },
    },
  });
}

const SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "siteSettings.json"
);

export type SiteSettingsData = {
  favicon_url: string;
  title_rotation_enabled: boolean;
  title_rotation_interval: number;
  title_words: string[];
};

const DEFAULT_SETTINGS: SiteSettingsData = {
  favicon_url: "",
  title_rotation_enabled: true,
  title_rotation_interval: 2.5,
  title_words: [
    "✦ Obloqulov — Digital Designer",
    "✦ Obloqulov — UI/UX Specialist",
    "✦ Obloqulov — 3D & Creative Dev",
  ],
};

function readLocalSettings(): SiteSettingsData {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return {
        favicon_url: parsed.favicon_url || "",
        title_rotation_enabled: parsed.title_rotation_enabled !== undefined ? parsed.title_rotation_enabled : true,
        title_rotation_interval: parsed.title_rotation_interval || 2.5,
        title_words: Array.isArray(parsed.title_words) && parsed.title_words.length > 0 ? parsed.title_words : DEFAULT_SETTINGS.title_words,
      };
    }
  } catch (e) {
    console.error("Error reading siteSettings.json:", e);
  }
  return DEFAULT_SETTINGS;
}

function writeLocalSettings(data: SiteSettingsData) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing siteSettings.json:", e);
  }
}

// GET: Return current site settings (favicon and dynamic title)
export async function GET(req: NextRequest) {
  try {
    const local = readLocalSettings();
    let favicon_url = local.favicon_url;

    // Try reading favicon from Supabase if available
    try {
      const supabase = getSupabaseServerClient(req);
      const { data } = await supabase
        .from("home_settings")
        .select("favicon_url")
        .eq("id", "default")
        .maybeSingle();

      if (data && data.favicon_url) {
        favicon_url = data.favicon_url;
      }
    } catch {
      // ignore if column doesn't exist yet
    }

    return NextResponse.json({
      success: true,
      favicon_url,
      title_rotation_enabled: local.title_rotation_enabled,
      title_rotation_interval: local.title_rotation_interval,
      title_words: local.title_words,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Update favicon and dynamic title settings
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(req);

    // Verify session via cookie or Authorization header
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let currentUser = user;
    if (!currentUser) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data: tokenData } = await supabase.auth.getUser(token);
        currentUser = tokenData?.user || null;
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Avtorizatsiyadan o‘tilmagan" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const current = readLocalSettings();

    const updatedData: SiteSettingsData = {
      favicon_url: body.favicon_url !== undefined ? String(body.favicon_url).trim() : current.favicon_url,
      title_rotation_enabled: body.title_rotation_enabled !== undefined ? Boolean(body.title_rotation_enabled) : current.title_rotation_enabled,
      title_rotation_interval: body.title_rotation_interval !== undefined ? Math.max(1, Number(body.title_rotation_interval)) : current.title_rotation_interval,
      title_words: Array.isArray(body.title_words) ? body.title_words.filter((w: string) => w.trim().length > 0) : current.title_words,
    };

    // 1. Save to local settings file for 0ms instant loading
    writeLocalSettings(updatedData);

    // 2. Try saving to Supabase home_settings table
    try {
      await supabase
        .from("home_settings")
        .update({ favicon_url: updatedData.favicon_url })
        .eq("id", "default");
    } catch (dbErr) {
      console.warn("Could not update favicon_url in Supabase:", dbErr);
    }

    // 3. Revalidate entire site layout so changes apply immediately
    try {
      revalidatePath("/", "layout");
    } catch {
      // ignore revalidation edge error
    }

    return NextResponse.json({
      success: true,
      ...updatedData,
      message: "Sozlamalar muvaffaqiyatli saqlandi!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
