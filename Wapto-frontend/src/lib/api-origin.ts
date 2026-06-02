import { PUBLIC_API_URL } from "@/src/constants";

export function getPublicApiOrigin(): string {
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() || PUBLIC_API_URL?.trim() || "";
  if (api) {
    const derived = api.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    if (derived) return derived;
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

export function joinPublicUrl(origin: string, path: string): string {
  const base = (origin || "").replace(/\/+$/, "");
  const suffix = (path || "").replace(/^\/+/, "");
  if (!base) return suffix ? `/${suffix}` : "";
  return suffix ? `${base}/${suffix}` : base;
}

export function getWhatsAppWebhookDisplayUrl(webhookPath?: string | null): string {
  if (!webhookPath?.trim()) return "";
  const path = webhookPath.startsWith("/") ? webhookPath : `/${webhookPath}`;
  return joinPublicUrl(getPublicApiOrigin(), path);
}
