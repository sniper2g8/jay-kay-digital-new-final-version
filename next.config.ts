import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
