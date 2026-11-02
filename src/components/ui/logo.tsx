import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const pixelMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const subMap = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-xs",
    xl: "text-sm",
  };

  const dim = pixelMap[size];

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {/* Iconic Bold Letter "S" Badge */}
      <div
        className={cn(
          sizeMap[size],
          "shrink-0 rounded-2xl relative transition-transform duration-200 hover:scale-105 shadow-md shadow-[#4F6AE8]/25 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#4F6AE8] via-[#3B52C4] to-[#283A97]"
        )}
      >
        <img
          src="/logo.svg"
          alt="Logo SIKUNJUNG"
          width={dim}
          height={dim}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-extrabold tracking-tight text-[#1F2547]", textMap[size])}>
            SIKUNJUNG
          </span>
          <span className={cn("text-[#8A90B0] font-medium tracking-normal", subMap[size])}>
            Inspektorat Bangli
          </span>
        </div>
      )}
    </div>
  );
}
