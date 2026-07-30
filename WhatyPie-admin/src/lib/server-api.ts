import { resolveStorageBaseUrl } from "./storage-url";

/** Server-side API base URL for Next.js route handlers (BFF → WhatyPie-api). */
export function getBackendApiUrl(): string {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api"
  );
}

/** Origin for static /uploads (no /api suffix). */
export function getStorageOrigin(): string {
  return resolveStorageBaseUrl().replace(/\/$/, "");
}
