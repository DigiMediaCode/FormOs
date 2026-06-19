import { notFound } from "next/navigation";
import { readMediaFile } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";

type MediaRouteProps = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function GET(_request: Request, { params }: MediaRouteProps) {
  const { assetId } = await params;
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      OR: [
        { id: assetId },
        { publicPath: `/media/${assetId}` },
      ],
    },
  });

  if (!asset) {
    notFound();
  }

  const file = await readMediaFile({
    fileName: asset.fileName,
    storagePath: asset.storagePath,
    fileData: asset.fileData,
  });

  if (!file) {
    notFound();
  }

  return new Response(file, {
    headers: {
      "content-type": asset.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
