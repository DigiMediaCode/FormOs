import Link from "next/link";
import {
  getPlatformSettings,
  getRenderablePlatformLogoUrl,
} from "@/lib/platform/settings";

type PlatformBrandProps = {
  href?: string;
  imageClassName?: string;
  textClassName?: string;
  className?: string;
};

export async function PlatformBrand({
  href,
  imageClassName = "h-auto max-w-[130px] object-contain",
  textClassName = "text-lg font-semibold text-slate-950",
  className,
}: PlatformBrandProps) {
  const settings = await getPlatformSettings();
  const logoUrl = getRenderablePlatformLogoUrl(settings);
  const content = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={settings.siteName} className={imageClassName} src={logoUrl} />
  ) : (
    <span className={textClassName}>{settings.siteName}</span>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
