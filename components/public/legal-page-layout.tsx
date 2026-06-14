import type { ReactNode } from "react";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

type LegalPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  description,
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
          <div className="legal-content mt-8">{children}</div>
        </div>
      </section>
      <PublicAdSection className="pb-12" slot="bottom" />
      <PublicFooter />
    </main>
  );
}
