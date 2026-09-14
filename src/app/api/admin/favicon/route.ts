import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import {
  getSiteSettings,
  readLocalSettingsFile,
  writeLocalSettingsFile,
  type SiteSettings,
} from "@/lib/getSiteSettings";

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

// GET: Return current site settings (favicon and dynamic title)
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      success: true,
      ...settings,
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
    const current = readLocalSettingsFile();

    const updatedData: SiteSettings = {
      favicon_url:
        body.favicon_url !== undefined
          ? String(body.favicon_url).trim()
          : current.favicon_url,
      title_rotation_enabled:
        body.title_rotation_enabled !== undefined
          ? Boolean(body.title_rotation_enabled)
          : current.title_rotation_enabled,
      title_rotation_interval:
        body.title_rotation_interval !== undefined
          ? Math.max(1, Number(body.title_rotation_interval))
          : current.title_rotation_interval,
      title_words: Array.isArray(body.title_words)
        ? body.title_words.filter(
            (w: unknown) => typeof w === "string" && w.trim().length > 0
          )
        : current.title_words,
    };

    // 1. Save to local settings file for 0ms instant loading
    writeLocalSettingsFile(updatedData);

    // 2. Try saving to Supabase home_settings table
    try {
      await supabase
        .from("home_settings")
        .update({
          favicon_url: updatedData.favicon_url,
          title_words: updatedData.title_words,
          title_rotation_enabled: updatedData.title_rotation_enabled,
          title_rotation_interval: updatedData.title_rotation_interval,
        })
        .eq("id", "default");
    } catch (dbErr) {
      console.warn("Could not update home_settings in Supabase:", dbErr);
    }

    // 3. Revalidate entire site layout and home page so changes apply immediately
    try {
      revalidatePath("/", "layout");
      revalidatePath("/", "page");
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
