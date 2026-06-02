type FeatureCardProps = {
  title: string;
  description: string;
  iconSrc?: string;
};

export function FeatureCard({ title, description, iconSrc }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 text-sm font-bold text-blue-600">
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-5 w-5 object-contain" src={iconSrc} />
        ) : (
          title.slice(0, 1)
        )}
      </div>
      <h3 className="mt-5 text-sm font-bold text-[#071124]">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </article>
  );
}
