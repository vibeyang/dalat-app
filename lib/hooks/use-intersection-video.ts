"use client";

import { RefObject, useEffect } from "react";

/**
 * Hook to autoplay/pause videos based on intersection observer visibility.
 * Videos will play when >70% visible and pause when scrolled away.
 */
export function useIntersectionVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  options = { threshold: 0.7 }
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If not active (not the current visible card), pause immediately
    if (!isActive) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= options.threshold) {
          // Play when visible enough
          video.play().catch(() => {
            // Ignore autoplay errors (user hasn't interacted yet)
          });
        } else {
          // Pause and reset when scrolled away
          video.pause();
        }
      },
      { threshold: options.threshold }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [videoRef, isActive, options.threshold]);
}
