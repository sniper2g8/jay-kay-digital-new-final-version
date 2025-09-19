import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for development
  turbopack: {},
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    '*': ['./supabase/functions/**/*'],
  },
};

export default nextConfig;
