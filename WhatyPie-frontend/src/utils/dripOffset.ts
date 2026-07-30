import { DelayUnit } from "@/src/types/dripCampaign";

const UNIT_MS: Record<DelayUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

export const unitValueToOffsetMs = (value: number, unit: DelayUnit): number => {
  return Math.max(0, value) * UNIT_MS[unit];
};

export const offsetMsToUnit = (offsetMs: number): { value: number; unit: DelayUnit } => {
  if (offsetMs >= UNIT_MS.days && offsetMs % UNIT_MS.days === 0) {
    return { value: offsetMs / UNIT_MS.days, unit: "days" };
  }
  if (offsetMs >= UNIT_MS.hours && offsetMs % UNIT_MS.hours === 0) {
    return { value: offsetMs / UNIT_MS.hours, unit: "hours" };
  }
  return { value: Math.round(offsetMs / UNIT_MS.minutes), unit: "minutes" };
};

export const formatOffsetLabel = (offsetMs: number): string => {
  if (!offsetMs) return "At enrollment";
  const { value, unit } = offsetMsToUnit(offsetMs);
  return `${value} ${unit}`;
};
