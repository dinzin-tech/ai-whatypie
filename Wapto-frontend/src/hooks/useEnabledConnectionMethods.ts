"use client";

import { useAppSelector } from "@/src/redux/hooks";
import {
  ALL_CONNECTION_METHODS,
  ConnectionMethodId,
  getDefaultIntegrateTab,
  getEnabledConnectionMethods,
  IntegrateWabaTab,
  isConnectionMethodEnabled,
  isTabEnabled,
} from "@/src/lib/connection-methods";

export function useEnabledConnectionMethods() {
  const setting = useAppSelector((state) => state.setting);
  const enabled = getEnabledConnectionMethods(setting);
  const hasAny = enabled.length > 0;
  const defaultTab = getDefaultIntegrateTab(enabled);

  return {
    enabled,
    hasAny,
    defaultTab,
    isEnabled: (id: ConnectionMethodId) => isConnectionMethodEnabled(id, enabled),
    isTabEnabled: (tab: IntegrateWabaTab) => isTabEnabled(tab, enabled),
    allMethods: ALL_CONNECTION_METHODS,
  };
}
