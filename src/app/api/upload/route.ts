import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ message: "No file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto" },
        (error: UploadApiErrorResponse | undefined, res: UploadApiResponse | undefined) => {
          if (error || !res) reject(error || new Error("Upload failed"));
          else resolve(res);
        }
      )
      .end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    type: result.resource_type,
  });
}
