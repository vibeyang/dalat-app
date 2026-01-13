/**
 * Full-screen loading skeleton for the feed.
 * Shows a pulsing gradient to indicate content is loading.
 */
export default function FeedLoading() {
  return (
    <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
      <div className="relative">
        {/* Pulsing circle */}
        <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />

        {/* Loading spinner overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
