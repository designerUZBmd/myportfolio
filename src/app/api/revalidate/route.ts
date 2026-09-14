import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, tag } = body;

    if (tag) {
      revalidateTag(tag, "max");
    }
    if (path) {
      revalidatePath(path);
    }
    revalidatePath("/portfolio");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/gallery");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
