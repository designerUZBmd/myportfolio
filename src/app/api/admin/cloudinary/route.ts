import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import cloudinary from "@/lib/cloudinary";

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

export type CloudinaryAsset = {
  public_id: string;
  format: string;
  version: number;
  resource_type: "image" | "video";
  type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
  secure_url: string;
  is_used: boolean;
  used_in: string[];
};

type UsedRef = {
  url: string;
  label: string;
};

// GET: Fetch all assets from Cloudinary and mark usage
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(req);

    // Verify session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Avtorizatsiyadan o‘tilmagan" },
        { status: 401 }
      );
    }

    // 1. Fetch Cloudinary resources (images + videos)
    const [imageRes, videoRes] = await Promise.all([
      cloudinary.api.resources({
        resource_type: "image",
        max_results: 500,
      }).catch((err) => {
        console.error("[Cloudinary API] Error fetching images:", err);
        return { resources: [] };
      }),
      cloudinary.api.resources({
        resource_type: "video",
        max_results: 500,
      }).catch((err) => {
        console.error("[Cloudinary API] Error fetching videos:", err);
        return { resources: [] };
      }),
    ]);

    const rawResources = [
      ...(imageRes.resources || []),
      ...(videoRes.resources || []),
    ];

    // 2. Fetch all used media URLs from database
    const usedRefs: UsedRef[] = [];

    // 2a. Portfolio cases (cover_url and gallery)
    const { data: cases } = await supabase
      .from("portfolio_cases")
      .select("title, cover_url, gallery");
    if (cases) {
      for (const c of cases) {
        if (c.cover_url) {
          usedRefs.push({ url: c.cover_url, label: `Portfolio: ${c.title || "Keys"} (Muqova)` });
        }
        if (Array.isArray(c.gallery)) {
          for (const g of c.gallery) {
            if (g && typeof g.url === "string") {
              usedRefs.push({ url: g.url, label: `Portfolio: ${c.title || "Keys"} (Galereya)` });
            }
          }
        }
      }
    }

    // 2b. Home settings
    const { data: home } = await supabase
      .from("home_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (home) {
      if (home.hero_image) usedRefs.push({ url: home.hero_image, label: "Bosh sahifa: Hero rasm" });
      if (home.editorial_image_left) usedRefs.push({ url: home.editorial_image_left, label: "Bosh sahifa: Editorial chap" });
      if (home.editorial_image_tall) usedRefs.push({ url: home.editorial_image_tall, label: "Bosh sahifa: Editorial baland" });
      if (home.editorial_image_short1) usedRefs.push({ url: home.editorial_image_short1, label: "Bosh sahifa: Editorial rasm 1" });
      if (home.editorial_image_short2) usedRefs.push({ url: home.editorial_image_short2, label: "Bosh sahifa: Editorial rasm 2" });
      if (Array.isArray(home.process_images)) {
        for (const p of home.process_images) {
          if (p) usedRefs.push({ url: p, label: "Bosh sahifa: Jarayon rasmlari" });
        }
      }
      if (Array.isArray(home.directions_marquee_images)) {
        for (const m of home.directions_marquee_images) {
          if (m) usedRefs.push({ url: m, label: "Bosh sahifa: Yuguruvchi satr" });
        }
      }
    }

    // 2c. Gallery items
    const { data: galleryItems } = await supabase
      .from("gallery_items")
      .select("url");
    if (galleryItems) {
      for (const item of galleryItems) {
        if (item.url) usedRefs.push({ url: item.url, label: "Galereya bo‘limi" });
      }
    }

    // 2d. Brands
    const { data: brands } = await supabase
      .from("brands")
      .select("name, logo_url");
    if (brands) {
      for (const b of brands) {
        if (b.logo_url) usedRefs.push({ url: b.logo_url, label: `Brend logosi: ${b.name}` });
      }
    }

    // 2e. Directions
    const { data: directions } = await supabase
      .from("directions")
      .select("title, image");
    if (directions) {
      for (const d of directions) {
        if (d.image) usedRefs.push({ url: d.image, label: `Yo‘nalish: ${d.title}` });
      }
    }

    // 2f. About settings
    const { data: about } = await supabase
      .from("about_settings")
      .select("resume_url, sections")
      .eq("id", "default")
      .maybeSingle();
    if (about) {
      if (about.resume_url) usedRefs.push({ url: about.resume_url, label: "About: Resume fayli" });
      if (Array.isArray(about.sections)) {
        for (const s of about.sections) {
          if (Array.isArray(s.floating_cards)) {
            for (const fc of s.floating_cards) {
              if (fc && fc.image_url) {
                usedRefs.push({ url: fc.image_url, label: `About: Kartochka (${fc.title || ""})` });
              }
            }
          }
        }
      }
    }

    // 3. Match Cloudinary resources with used URLs
    const assets: CloudinaryAsset[] = rawResources.map((res: any) => {
      const publicId = res.public_id;
      const matched = usedRefs.filter((ref) => {
        if (!ref.url) return false;
        // Check if the URL contains the public_id
        return ref.url.includes(publicId);
      });

      const uniqueLabels = Array.from(new Set(matched.map((m) => m.label)));

      return {
        public_id: res.public_id,
        format: res.format,
        version: res.version,
        resource_type: res.resource_type === "video" ? "video" : "image",
        type: res.type,
        created_at: res.created_at,
        bytes: res.bytes || 0,
        width: res.width,
        height: res.height,
        url: res.url,
        secure_url: res.secure_url,
        is_used: uniqueLabels.length > 0,
        used_in: uniqueLabels,
      };
    });

    // Sort by created_at descending (newest first)
    assets.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const summary = {
      total: assets.length,
      images: assets.filter((a) => a.resource_type === "image").length,
      videos: assets.filter((a) => a.resource_type === "video").length,
      used: assets.filter((a) => a.is_used).length,
      unused: assets.filter((a) => !a.is_used).length,
    };

    return NextResponse.json({
      success: true,
      assets,
      summary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[API Admin Cloudinary GET] Error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Delete an asset from Cloudinary
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient(req);

    // Verify session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Avtorizatsiyadan o‘tilmagan" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { public_id, resource_type } = body;

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: "public_id ko‘rsatilmadi" },
        { status: 400 }
      );
    }

    console.log(
      `[Cloudinary DELETE] Deleting asset ${public_id} (${resource_type}) by ${user.email}`
    );

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type === "video" ? "video" : "image",
      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn("[Cloudinary DELETE] Response was:", result);
    }

    return NextResponse.json({
      success: true,
      result,
      message: "Fayl Cloudinary'dan muvaffaqiyatli o‘chirildi",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[API Admin Cloudinary DELETE] Error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
