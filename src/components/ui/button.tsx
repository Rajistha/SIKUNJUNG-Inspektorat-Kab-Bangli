import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6AE8] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]",
          // Variants
          variant === "primary" &&
            "bg-[#4F6AE8] text-white hover:bg-[#3B52C4] shadow-sm hover:shadow",
          variant === "secondary" &&
            "bg-white text-[#4F6AE8] border border-[#E6E8F5] hover:bg-[#EEF1FF] hover:border-[#4F6AE8]/30",
          variant === "danger" &&
            "bg-[#E5484D] text-white hover:bg-red-700 shadow-sm",
          variant === "outline" &&
            "bg-transparent text-[#1F2547] border border-[#E6E8F5] hover:bg-gray-50",
          variant === "ghost" &&
            "bg-transparent text-[#1F2547] hover:bg-[#EEF1FF] hover:text-[#4F6AE8]",
          // Sizes (min-height 48px for standard mobile/desktop comfort per design.md)
          size === "sm" && "h-9 px-3 text-sm rounded-[10px]",
          size === "md" && "h-12 px-5 text-base rounded-[12px]",
          size === "lg" && "h-14 px-7 text-lg rounded-[14px]",
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

