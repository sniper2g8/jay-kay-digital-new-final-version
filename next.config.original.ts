import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    "*": ["./supabase/functions/**/*"],
  },
};

export default nextConfig;
