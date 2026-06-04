"use client";

import Link from "next/link";
import { Rocket, User, type LucideIcon } from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";

type LandingActionLinkProps = {
  children: ReactNode;
  className: string;
  href: string;
  icon: "rocket" | "user";
  pendingText: string;
};

const icons: Record<LandingActionLinkProps["icon"], LucideIcon> = {
  rocket: Rocket,
  user: User,
};

export function LandingActionLink({
  children,
  className,
  href,
  icon,
  pendingText,
}: LandingActionLinkProps) {
  const [isPending, setIsPending] = useState(false);
  const Icon = icons[icon];

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    setIsPending(true);
  }

  return (
    <Link
      aria-disabled={isPending}
      className={`${className} items-center justify-center gap-2 ${
        isPending ? "pointer-events-none cursor-not-allowed opacity-70" : ""
      }`}
      href={href}
      onClick={handleClick}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {isPending ? pendingText : children}
    </Link>
  );
}
