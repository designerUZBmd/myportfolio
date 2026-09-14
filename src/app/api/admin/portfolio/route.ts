import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath, revalidateTag } from "next/cache";

function getSupabaseServerClient(req: NextRequest) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwuelpuepfmptrekvejc.supabase.co";
  const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const supabaseKey = serviceKey || anonKey;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
      },
    },
  });
}

// PUT: Update an existing portfolio case
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(req);

    // Verify session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[API Portfolio PUT] Unauthorized user:", userError);
      return NextResponse.json(
        {
          success: false,
          error: "Sessiyangiz tugagan. Iltimos, qaytadan tizimga kiring.",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, livePath, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Loyiha ID si ko‘rsatilmadi" },
        { status: 400 }
      );
    }

    console.log(`[API Portfolio PUT] Updating case ${id} by ${user.email}`);

    const { data, error } = await supabase
      .from("portfolio_cases")
      .update(updateFields)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[API Portfolio PUT] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Bazadagi xatolik: " + error.message },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      console.error("[API Portfolio PUT] 0 rows updated for id:", id);
      return NextResponse.json(
        {
          success: false,
          error: "O‘zgarishlar saqlanmadi (0 ta qator yangilandi). RLS ruxsati yoki ID topilmadi.",
        },
        { status: 403 }
      );
    }

    // Revalidate paths immediately
    if (livePath) {
      revalidatePath(livePath);
    }
    revalidatePath("/portfolio");
    revalidatePath("/");
    revalidateTag("portfolio", "max");
    revalidateTag("home", "max");

    return NextResponse.json({
      success: true,
      message: "Loyiha muvaffaqiyatli saqlandi",
      data: data[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[API Portfolio PUT] Server error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Create a new portfolio case
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(req);

    // Verify session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[API Portfolio POST] Unauthorized user:", userError);
      return NextResponse.json(
        {
          success: false,
          error: "Sessiyangiz tugagan. Iltimos, qaytadan tizimga kiring.",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { livePath, ...newCaseData } = body;

    console.log(`[API Portfolio POST] Creating new case by ${user.email}`);

    const { data, error } = await supabase
      .from("portfolio_cases")
      .insert(newCaseData)
      .select();

    if (error) {
      console.error("[API Portfolio POST] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Bazadagi xatolik: " + error.message },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Keys yaratilmadi (0 ta qator qo‘shildi)" },
        { status: 403 }
      );
    }

    // Revalidate
    if (livePath) {
      revalidatePath(livePath);
    }
    revalidatePath("/portfolio");
    revalidatePath("/");
    revalidateTag("portfolio", "max");
    revalidateTag("home", "max");

    return NextResponse.json({
      success: true,
      message: "Yangi loyiha muvaffaqiyatli yaratildi",
      data: data[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[API Portfolio POST] Server error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
