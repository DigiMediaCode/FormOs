import Link from "next/link";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  href?: string;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  href = "/signup",
}: PricingCardProps) {
  return (
    <article
      className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
        highlighted ? "border-blue-300 ring-4 ring-blue-100" : "border-blue-100"
      }`}
    >
      {highlighted ? (
        <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      ) : null}
      <h3 className="text-xl font-semibold text-[#071124]">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-6 text-4xl font-semibold tracking-tight text-[#071124]">
        {price}
      </p>
      <Link
        className={`mt-6 inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition ${
          highlighted
            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
            : "border border-blue-100 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50"
        }`}
        href={href}
      >
        Get Started
      </Link>
      <ul className="mt-6 grid gap-3 text-sm text-slate-700">
        {features.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <span className="text-emerald-600">&check;</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
