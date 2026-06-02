import { API_URL } from "@/src/constants";

/** Public API origin without /api suffix (e.g. https://apiv2.wapto.app). */
export function getPublicApiOrigin(): string {
  const api = API_URL?.trim() || "";
  if (api) {
    const derived = api.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    if (derived) return derived;
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

/** Join origin + path without duplicate slashes. */
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

export function getFacebookLeadWebhookDisplayUrl(): string {
  return joinPublicUrl(getPublicApiOrigin(), "/webhook/facebook/leadgen/receive");
}
