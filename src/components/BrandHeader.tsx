"use client";

import { LogoVariants } from "@/components/Logo";
import { COMPANY_INFO } from "@/lib/brand";

interface BrandHeaderProps {
  variant?: "compact" | "full";
  showTagline?: boolean;
  className?: string;
  centerAlign?: boolean;
}

export default function BrandHeader({
  variant = "compact",
  showTagline = true,
  className = "",
  centerAlign = true,
}: BrandHeaderProps) {
  if (variant === "full") {
    return (
      <div className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="container mx-auto px-4 py-6">
          <div
            className={`flex items-center ${centerAlign ? "justify-center" : "justify-start"} space-x-4`}
          >
            <LogoVariants.HeroLogo />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div
          className={`flex items-center ${centerAlign ? "justify-center" : "justify-between"} space-x-4`}
        >
          <div className="flex items-center space-x-4">
            <LogoVariants.NavLogo showText={true} />
          </div>
          {showTagline && !centerAlign && (
            <div className="hidden md:block text-right">
              <p className="text-sm text-muted-foreground">
                {COMPANY_INFO.motto}
              </p>
            </div>
          )}
        </div>
        {showTagline && centerAlign && (
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              {COMPANY_INFO.motto}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
