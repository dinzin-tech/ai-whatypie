export type ConnectionMethodId = "manual" | "qr_scan" | "embedded_signup";

export const ALL_CONNECTION_METHODS: ConnectionMethodId[] = ["manual", "qr_scan", "embedded_signup"];

/** URL tab param on /integrate_waba */
export type IntegrateWabaTab = "manual" | "qrcode";

export function getEnabledConnectionMethods(
  setting?: { enabled_connection_methods?: ConnectionMethodId[] | string[] | null } | null,
): ConnectionMethodId[] {
  const raw = setting?.enabled_connection_methods;
  if (Array.isArray(raw) && raw.length > 0) {
    const allowed = new Set<string>(ALL_CONNECTION_METHODS);
    const methods: ConnectionMethodId[] = [];
    for (const m of raw) {
      const id = String(m);
      if (allowed.has(id)) methods.push(id as ConnectionMethodId);
    }
    if (methods.length > 0) return methods;
  }
  return [...ALL_CONNECTION_METHODS];
}

export function isConnectionMethodEnabled(
  id: ConnectionMethodId,
  enabled: ConnectionMethodId[],
): boolean {
  return enabled.includes(id);
}

/** First enabled tab for Integrate WABA (manual preferred, then qrcode). */
export function getDefaultIntegrateTab(enabled: ConnectionMethodId[]): IntegrateWabaTab | null {
  if (enabled.includes("manual")) return "manual";
  if (enabled.includes("qr_scan")) return "qrcode";
  return null;
}

export function tabParamToMethod(tab: IntegrateWabaTab): ConnectionMethodId {
  return tab === "qrcode" ? "qr_scan" : "manual";
}

export function isTabEnabled(tab: IntegrateWabaTab, enabled: ConnectionMethodId[]): boolean {
  return isConnectionMethodEnabled(tabParamToMethod(tab), enabled);
}
