import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  requiredIndicator?: boolean;
  optionalIndicator?: boolean;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      requiredIndicator,
      optionalIndicator,
      error,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between text-sm font-medium text-[#1F2547]">
            <label htmlFor={inputId}>
              {label}
              {requiredIndicator && <span className="text-[#E5484D] ml-1 font-semibold">* Wajib</span>}
              {optionalIndicator && <span className="text-[#8A90B0] ml-1 font-normal">(opsional)</span>}
            </label>
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full h-12 px-4 rounded-[14px] bg-white border border-[#E6E8F5] text-[#1F2547] text-sm md:text-base placeholder:text-[#8A90B0] shadow-[0_2px_6px_rgba(79,106,232,0.03)] transition-all duration-200 outline-none",
            "hover:border-[#4F6AE8]/50 hover:bg-[#FAFBFF]",
            "focus:border-[#4F6AE8] focus:ring-4 focus:ring-[#4F6AE8]/15 focus:bg-white",
            error && "border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/15",
            "disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#E5484D] mt-1 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#8A90B0] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
