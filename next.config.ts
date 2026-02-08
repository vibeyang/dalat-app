import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled for dynamic routes with uncached data
  // cacheComponents: true,
  
  // Removed CSP headers - they were conflicting with Vercel's default settings
  // and causing script-src 'none' to block all JavaScript
};

export default nextConfig;
