import { readFile } from "fs/promises";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type MediaRouteProps = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function GET(_request: Request, { params }: MediaRouteProps) {
  const { assetId } = await params;
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    notFound();
  }

  try {
    const file = await readFile(asset.storagePath);

    return new Response(file, {
      headers: {
        "content-type": asset.mimeType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    notFound();
  }
}
