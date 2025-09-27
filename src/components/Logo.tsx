"use client";

import Image from "next/image";
import { BRAND_ASSETS, COMPANY_INFO } from "@/lib/brand";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: { width: 24, height: 24, textSize: "text-sm" },
  md: { width: 32, height: 32, textSize: "text-base" },
  lg: { width: 48, height: 48, textSize: "text-lg" },
  xl: { width: 64, height: 64, textSize: "text-xl" },
};

export default function Logo({
  variant = "icon",
  size = "md",
  showText = false,
  className = "",
  textClassName = "",
  onClick,
}: LogoProps) {
  const { width, height, textSize } = sizeMap[size];
  const logoSrc =
    variant === "full" ? BRAND_ASSETS.logo.main : BRAND_ASSETS.logo.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (variant === "full") {
    return (
      <div
        className={`flex items-center cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <Image
          src={logoSrc}
          alt={`${COMPANY_INFO.name} Logo`}
          width={200}
          height={80}
          className="h-auto w-auto"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center space-x-3 cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <Image
        src={logoSrc}
        alt={`${COMPANY_INFO.name} Logo`}
        width={width}
        height={height}
        className={`h-${size === "sm" ? "6" : size === "md" ? "8" : size === "lg" ? "12" : "16"} w-${size === "sm" ? "6" : size === "md" ? "8" : size === "lg" ? "12" : "16"}`}
        priority
      />
      {showText && (
        <div className={textClassName}>
          <h1 className={`font-bold text-foreground ${textSize}`}>
            {COMPANY_INFO.name}
          </h1>
          {size !== "sm" && (
            <p
              className={`text-muted-foreground ${size === "xl" ? "text-sm" : "text-xs"}`}
            >
              {COMPANY_INFO.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Preset logo configurations for common use cases
export const LogoVariants = {
  // Navigation logo with text
  NavLogo: (props: Partial<LogoProps>) => (
    <Logo variant="icon" size="md" showText={true} {...props} />
  ),

  // Auth page logo
  AuthLogo: (props: Partial<LogoProps>) => (
    <Logo variant="icon" size="xl" showText={false} {...props} />
  ),

  // Invoice header logo
  InvoiceLogo: (props: Partial<LogoProps>) => (
    <Logo
      variant="icon"
      size="lg"
      showText={false}
      className="bg-white rounded-full p-2"
      {...props}
    />
  ),

  // Footer logo
  FooterLogo: (props: Partial<LogoProps>) => (
    <Logo variant="icon" size="sm" showText={false} {...props} />
  ),

  // Full logo for hero sections
  HeroLogo: (props: Partial<LogoProps>) => <Logo variant="full" {...props} />,
};
