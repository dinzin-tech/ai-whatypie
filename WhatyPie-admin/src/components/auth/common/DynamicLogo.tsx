"use client";

import { Skeleton } from "@/src/elements/ui/skeleton";
import { SYSTEM_LOGO_PATH } from "@/src/constants/branding";
import { useGetIsDemoModeQuery } from "@/src/redux/api/authApi";
import { getResolvedImageUrl } from "@/src/utils/image";
import Image from "next/image";
import { useState } from "react";

interface DynamicLogoProps {
  width?: number;
  height?: number;
  className?: string;
  skeletonClassName?: string;
}

/**
 * Login / auth logo: API settings upload first, bundled WhatyPie logo if missing or 404.
 */
export const DynamicLogo = ({
  width = 160,
  height = 48,
  className = "h-12 w-auto object-contain",
  skeletonClassName = "h-12 w-40",
}: DynamicLogoProps) => {
  const { data: demoModeRes, isLoading, isError } = useGetIsDemoModeQuery();
  const [useSystemLogo, setUseSystemLogo] = useState(false);

  if (isLoading) {
    return <Skeleton className={skeletonClassName} />;
  }

  const apiLogoPath = isError ? undefined : demoModeRes?.logo_light_url;
  const logoUrl = useSystemLogo
    ? SYSTEM_LOGO_PATH
    : getResolvedImageUrl(apiLogoPath, SYSTEM_LOGO_PATH);

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
