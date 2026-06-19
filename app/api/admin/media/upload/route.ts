import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { saveMediaFile } from "@/lib/media/storage";
import { getAppUrl } from "@/lib/app-url";

export async function POST(request: Request) {
  try {
    const user = await requireSuperAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const asset = await saveMediaFile({
      file,
      altText: String(formData.get("altText") ?? ""),
      createdById: user.id,
    });

    return NextResponse.json({
      id: asset.id,
      publicPath: asset.publicPath,
      publicUrl: new URL(asset.publicPath, getAppUrl()).toString(),
      fileName: asset.fileName,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to upload media.",
      },
      { status: 400 },
    );
  }
}
