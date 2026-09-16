import type { NextConfig } from "next";
import { storageRemotePatterns } from "./src/lib/storage-remote-patterns";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/auth/login",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: storageRemotePatterns(),
  },
  async rewrites() {
    return [
      { source: "/socket.io/:path*", destination: "http://localhost:5000/socket.io/:path*" },
    ];
  },
};

export default nextConfig;
