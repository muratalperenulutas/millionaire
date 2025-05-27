import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_ADAPTER_URL: process.env.NEXT_PUBLIC_ADAPTER_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
