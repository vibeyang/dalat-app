"use client";

import { useRef } from "react";
import { useIntersectionVideo } from "@/lib/hooks/use-intersection-video";

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  poster?: string;
}

/**
 * Autoplay video component for the feed.
 * Plays when visible and active, pauses when scrolled away.
 */
export function VideoPlayer({ src, isActive, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useIntersectionVideo(videoRef, isActive);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className="absolute inset-0 w-full h-full object-contain z-10"
      muted
      loop
      playsInline
      preload={isActive ? "auto" : "metadata"}
    />
  );
}
