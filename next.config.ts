import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Skip TypeScript checking during build (supabase functions use Deno)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
