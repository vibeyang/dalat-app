"use client";

import { triggerHaptic } from "@/lib/haptics";

interface EventAttributionPillProps {
  eventTitle: string;
  onClick: () => void;
}

/**
 * Minimal event attribution pill for the feed.
 * Shows truncated event name, tap to expand details.
 */
export function EventAttributionPill({
  eventTitle,
  onClick,
}: EventAttributionPillProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic("selection");
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-sm font-medium transition-all active:scale-95 active:bg-black/70 hover:bg-black/70"
      aria-label={`View event: ${eventTitle}`}
    >
      <span className="truncate max-w-[200px]">{eventTitle}</span>
      <svg
        className="w-4 h-4 flex-shrink-0 opacity-70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
