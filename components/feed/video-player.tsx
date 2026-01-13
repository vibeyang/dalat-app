"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useIntersectionVideo } from "@/lib/hooks/use-intersection-video";

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  poster?: string;
}

/**
 * Autoplay video component for the feed.
 * Plays when visible and active, pauses when scrolled away.
 * Tap to toggle mute/unmute.
 */
export function VideoPlayer({ src, isActive, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useIntersectionVideo(videoRef, isActive);

  // Reset mute and loading state when video source changes
  useEffect(() => {
    setIsMuted(true);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, [src]);

  const handleTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="absolute inset-0 z-10" onClick={handleTap}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse z-0" />
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 w-full h-full object-contain"
        muted={isMuted}
        loop
        playsInline
        preload={isActive ? "auto" : "metadata"}
        onLoadedData={handleLoadedData}
      />

      {/* Mute indicator */}
      <div className="absolute bottom-20 right-4 p-2 rounded-full bg-black/50 pointer-events-none">
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </div>
    </div>
  );
}
