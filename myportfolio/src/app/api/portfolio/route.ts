import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Portfolio from "@/models/Portfolio";
import Category from "@/models/Category";

// GET → portfolio case’larni olish
// Query support:
// ?category=web-design
// ?featured=true
// GET → portfolio case’larni olish
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const categorySlug = searchParams.get("category");

    // 🔥 1. AGAR SLUG BOR BO‘LSA — Bitta case qaytaramiz
    if (slug) {
      const item = await Portfolio.findOne({ slug, isPublished: true })
        .populate("category", "title slug")
        .lean();

      return NextResponse.json(item);
    }

    // 🔹 2. Aks holda list qaytaramiz
    const query: any = { isPublished: true };

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (!category) return NextResponse.json([]);
      query.category = category._id;
    }

    const items = await Portfolio.find(query)
      .populate("category", "title slug")
      .sort({ year: -1 })
      .lean();

    return NextResponse.json(items);
  } catch (error) {
    console.error("PORTFOLIO GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

// POST → yangi case qo‘shish
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      slug,
      categorySlug,
      coverMedia,
      gallery,
      excerpt,
      description,
      year,
      client,
      role,
      tools,
      sections,
      isFeatured,
    } = body;

    // Minimal validation
    if (!title || !slug || !categorySlug || !coverMedia || !excerpt || !year) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    const exists = await Portfolio.findOne({ slug });
    if (exists) {
      return NextResponse.json(
        { message: "Portfolio with this slug already exists" },
        { status: 409 }
      );
    }

    const item = await Portfolio.create({
      title,
      slug,
      category: category._id,
      coverMedia,
      gallery,
      excerpt,
      description,
      year,
      client,
      role,
      tools,
      sections,
      isFeatured,
      isPublished: true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("PORTFOLIO POST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}
