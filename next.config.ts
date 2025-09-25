import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude supabase functions from file tracing
  outputFileTracingExcludes: {
    '*': ['./supabase/functions/**/*'],
  },
  // Optimize fonts and reduce preload warnings
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
  // Improve font loading
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize font loading for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;