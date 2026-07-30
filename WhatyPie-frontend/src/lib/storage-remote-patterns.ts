import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { resolveStorageBaseUrl } from "./storage-url";

export function storageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "ui-avatars.com" },
  ];

  try {
    const url = new URL(resolveStorageBaseUrl());
    const protocol = (url.protocol.replace(":", "") || "https") as "http" | "https";
    patterns.push({
      protocol,
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/**",
    });
  } catch {
    // ignore invalid URL at build time
  }

  return patterns;
}
