import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 完全忽略 ESLint 错误和警告
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 完全忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  // 禁用严格模式以避免额外的检查
  reactStrictMode: false,
};

export default nextConfig;


