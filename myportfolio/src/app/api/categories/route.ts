import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

// GET → barcha category’larni olish
export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("CATEGORY API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST → yangi category qo‘shish
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, slug, description, order } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { message: "Title and slug are required" },
        { status: 400 }
      );
    }

    const exists = await Category.findOne({ slug });
    if (exists) {
      return NextResponse.json(
        { message: "Category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await Category.create({
      title,
      slug,
      description,
      order,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}
