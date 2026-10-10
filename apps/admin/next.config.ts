import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Resolve workspace packages (@rental/*) which ship TypeScript source.
  transpilePackages: ["@rental/ui", "@rental/types", "@rental/api-client"],
};

export default nextConfig;
