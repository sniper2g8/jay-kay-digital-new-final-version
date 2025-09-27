import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during build to avoid warnings breaking the build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    "*": ["./supabase/functions/**/*"],
  },
  // Optimize package imports
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "lucide-react"],
  },
};

export default nextConfig;
