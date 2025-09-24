import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    '*': ['./supabase/functions/**/*'],
  },
};

export default nextConfig;