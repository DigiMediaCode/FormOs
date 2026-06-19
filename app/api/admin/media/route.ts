import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { deleteMediaFile } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";

export async function GET() {
  await requireSuperAdmin();

  const assets = await prisma.mediaAsset.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
    select: {
      id: true,
      publicPath: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      size: true,
      altText: true,
      createdAt: true,
    },
  });

  const appUrl = getAppUrl();

  return NextResponse.json({
    assets: assets.map((asset) => ({
      ...asset,
      publicUrl: new URL(asset.publicPath, appUrl).toString(),
    })),
  });
}

export async function DELETE(request: Request) {
  try {
    await requireSuperAdmin();
    const payload = (await request.json()) as {
      id?: string;
    };

    if (!payload.id) {
      return NextResponse.json({ error: "Media asset is required." }, { status: 400 });
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Media asset was not found." }, { status: 404 });
    }

    await prisma.mediaAsset.delete({
      where: {
        id: asset.id,
      },
    });

    await deleteMediaFile({
      fileName: asset.fileName,
      storagePath: asset.storagePath,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete media.",
      },
      { status: 400 },
    );
  }
}
