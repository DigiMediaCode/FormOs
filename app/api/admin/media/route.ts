import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
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
