import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for development
  turbopack: {},
  // Enable standalone mode for Docker builds
  output: "standalone",
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    '*': ['./supabase/functions/**/*'],
  },
};

export default nextConfig;