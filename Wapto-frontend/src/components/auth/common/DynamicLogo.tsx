"use client";

import { Skeleton } from "@/src/elements/ui/skeleton";
import { SYSTEM_LOGO_PATH } from "@/src/constants/branding";
import { useGetIsDemoModeQuery } from "@/src/redux/api/authApi";
import { DynamicLogoProps } from "@/src/types/auth";
import Image from "next/image";
import { useState } from "react";

const resolveLogoUrl = (url?: string): string => {
  if (!url || url.length <= 0) return SYSTEM_LOGO_PATH;
  if (/^https?:\/\//i.test(url)) return url;
  const normalized = url.replace(/\\/g, "/");
  const storage = (process.env.NEXT_PUBLIC_STORAGE_URL ?? "").replace(/\/$/, "");
  if (normalized.startsWith("/uploads/") && storage) {
    return `${storage}${normalized}`;
  }
  if (normalized.startsWith("/assets/")) return normalized;
  return storage ? `${storage}/${normalized.replace(/^\//, "")}` : SYSTEM_LOGO_PATH;
};

/**
 * Auth logo: API settings upload first, bundled WAPTO logo if missing or 404.
 */
export const DynamicLogo = ({
  width = 200,
  height = 56,
  className = "h-14 w-auto object-contain",
  skeletonClassName = "h-14 w-48 animate-pulse bg-transparent",
}: DynamicLogoProps) => {
  const { data: demoModeRes, isLoading, isError } = useGetIsDemoModeQuery();
  const [useSystemLogo, setUseSystemLogo] = useState(false);

  if (isLoading) {
    return <Skeleton className={skeletonClassName} />;
  }

  const apiLogoPath = isError ? undefined : demoModeRes?.logo_dark_url;
  const logoUrl = useSystemLogo ? SYSTEM_LOGO_PATH : resolveLogoUrl(apiLogoPath);

  return (
    <Image
      src={logoUrl}
      alt="App Logo"
      width={width}
      height={height}
      className={className}
      unoptimized
      priority
      onError={() => {
        if (!useSystemLogo) setUseSystemLogo(true);
      }}
    />
  );
};
