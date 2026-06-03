"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type PackageCarouselProps = {
  children: ReactNode;
};

export function PackageCarousel({ children }: PackageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canMoveLeft, setCanMoveLeft] = useState(false);
  const [canMoveRight, setCanMoveRight] = useState(false);

  function updateControls() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    setCanMoveLeft(track.scrollLeft > 4);
    setCanMoveRight(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
    );
  }

  function move(direction: "left" | "right") {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const card = track.querySelector<HTMLElement>("[data-package-card]");
    const gap = 20;
    const distance = card
      ? card.offsetWidth + gap
      : Math.floor(track.clientWidth * 0.85);

    track.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    updateControls();

    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, []);

  return (
    <div className="relative mt-10">
      <div className="mb-4 flex justify-end gap-2">
        <button
          aria-label="Previous package"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canMoveLeft}
          onClick={() => move("left")}
          type="button"
        >
          <span aria-hidden="true">&lt;</span>
        </button>
        <button
          aria-label="Next package"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canMoveRight}
          onClick={() => move("right")}
          type="button"
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
      <div
        aria-label="Available FormOS packages"
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {children}
      </div>
    </div>
  );
}
