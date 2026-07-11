"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  /** Height class (Tailwind), defaults to "h-52" */
  heightClass?: string;
  /** Show arrow-key hint on first render */
  showHint?: boolean;
}

/**
 * Displays one or more images in a carousel with:
 * - Left/right arrow buttons
 * - Keyboard arrow-key navigation (← →)
 * - Dot indicators at the bottom
 * - Smooth crossfade transition
 * - Falls back to single-image view when only one image
 */
export default function ImageCarousel({
  images,
  alt = "Issue photo",
  heightClass = "h-52",
  showHint = false,
}: ImageCarouselProps) {
  const [idx, setIdx] = useState(0);
  const total = images.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  // Keyboard navigation
  useEffect(() => {
    if (total <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, prev, next]);

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-50 ${heightClass}`}>
        <span className="text-7xl opacity-80">📌</span>
      </div>
    );
  }

  const current = images[idx];
  const isDataImage = current?.startsWith("data:");
  const isVideo = current?.startsWith("data:video/") || current?.endsWith(".mp4") || current?.endsWith(".webm") || current?.endsWith(".ogg");

  return (
    <div className={`group relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-ink-100 to-ink-50 ${heightClass}`}>
      {/* Current media */}
      {isVideo ? (
        <video
          src={current}
          controls
          className="h-full w-full object-cover"
          key={idx}
        />
      ) : isDataImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt={`${alt} ${idx + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          key={idx}
        />
      ) : (
        <span className="text-7xl opacity-80">{current}</span>
      )}

      {/* Navigation arrows (only when multiple images) */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter badge */}
      {total > 1 && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Images className="h-3 w-3" />
          {idx + 1}/{total}
        </span>
      )}

      {/* Arrow-key hint */}
      {showHint && total > 1 && (
        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] text-white/80 backdrop-blur-sm animate-fade-up">
          Use ← → arrow keys to navigate
        </span>
      )}
    </div>
  );
}
