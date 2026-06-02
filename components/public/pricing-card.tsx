import Link from "next/link";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
}: PricingCardProps) {
  return (
    <article
      className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
        highlighted ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200"
      }`}
    >
      {highlighted ? (
        <span className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      ) : null}
      <h3 className="text-xl font-semibold text-slate-950">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
        {price}
      </p>
      <Link
        className={`mt-6 inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        }`}
        href="/signup"
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
