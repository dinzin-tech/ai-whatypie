import type { NextConfig } from "next";
import { storageRemotePatterns } from "./src/lib/storage-remote-patterns";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: storageRemotePatterns(),
  },
  async rewrites() {
    return [
      { source: "/refund-policy", destination: "/page/refund-policy" },
      { source: "/privacy-policy", destination: "/page/privacy-policy" },
      { source: "/terms-and-conditions", destination: "/page/terms-and-conditions" },
    ];
  },
};

export default nextConfig;
