import Link from "next/link";
import { ExternalLink, Image, Upload } from "lucide-react";
import { uploadMediaAssetAction } from "@/app/admin/media/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type MediaPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }

  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminMediaPage({ searchParams }: MediaPageProps) {
  await requireSuperAdmin();
  const { error, success } = await searchParams;
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Media Library
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Upload platform assets for logos, favicons, CMS pages, and email content.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Image className="size-3.5" />
            {assets.length} recent assets
          </span>
        </header>

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Upload className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Upload Media Asset
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These files are stored by FormOS for admin-controlled content only. Form
                submitter uploads still go to the form owner's selected Google Drive or Dropbox.
              </p>
            </div>
          </div>

          <form action={uploadMediaAssetAction} className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
              Image file
              <input
                accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,video/mp4,video/webm,video/quicktime"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                name="file"
                required
                type="file"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
              Alt text
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                name="altText"
                placeholder="FormOS logo"
              />
            </label>
            <SubmitButton
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              pendingText="Uploading..."
              showStatus={false}
            >
              <Upload className="size-4" />
              Upload
            </SubmitButton>
          </form>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Recent Assets</h3>
            <p className="mt-1 text-sm text-slate-600">
              Copy the <code>/media/...</code> path into platform settings, CMS image blocks,
              CMS rich text, or safe email HTML.
            </p>
          </div>

          {assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Image className="mx-auto size-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-900">No media uploaded yet</p>
              <p className="mt-1 text-sm text-slate-500">Upload a logo, favicon, or page image to begin.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <article
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  key={asset.id}
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {asset.mimeType.startsWith("video/") ? (
                      <video
                        className="max-h-full max-w-full object-contain"
                        controls
                        src={asset.publicPath}
                      />
                    ) : (
                      <img
                        alt={asset.altText || asset.originalName || asset.fileName}
                        className="max-h-full max-w-full object-contain"
                        src={asset.publicPath}
                      />
                    )}
                  </div>
                  <div>
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {asset.originalName || asset.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {asset.mimeType} · {formatBytes(asset.size)} · {formatDate(asset.createdAt)}
                    </p>
                  </div>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                    readOnly
                    value={asset.publicPath}
                  />
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    href={asset.publicPath}
                    target="_blank"
                  >
                    <ExternalLink className="size-3.5" />
                    Open Asset
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
