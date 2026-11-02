"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  requiredIndicator?: boolean;
  optionalIndicator?: boolean;
  error?: string;
  helperText?: string;
  sizeVariant?: "sm" | "md";
  placeholder?: string;
  align?: "left" | "right";
}

interface ParsedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      requiredIndicator,
      optionalIndicator,
      error,
      helperText,
      id,
      sizeVariant = "md",
      placeholder = "Pilih salah satu...",
      align = "left",
      value,
      defaultValue,
      onChange,
      disabled,
      children,
      name,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract options from <option> children
    const options: ParsedOption[] = useMemo(() => {
      const list: ParsedOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === "option") {
          const optProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
          const val = optProps.value !== undefined ? String(optProps.value) : "";
          const lbl = optProps.children ? String(optProps.children) : val;
          list.push({
            value: val,
            label: lbl,
            disabled: optProps.disabled,
          });
        }
      });
      return list;
    }, [children]);

    // Internal value tracking if uncontrolled
    const [internalValue, setInternalValue] = useState<string>(
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
        ? String(defaultValue)
        : options[0]?.value || ""
    );

    const currentValue = value !== undefined ? String(value) : internalValue;

    // Find currently selected option
    const selectedOption = options.find((opt) => opt.value === currentValue);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      if (isOpen) {
        window.addEventListener("keydown", handleKeyDown);
      }
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const handleSelect = (optValue: string) => {
      setInternalValue(optValue);
      setIsOpen(false);

      if (onChange) {
        const syntheticEvent = {
          target: { value: optValue, name: name || "" },
          currentTarget: { value: optValue, name: name || "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="w-full space-y-1.5 relative" ref={containerRef}>
        {label && (
          <div className="flex items-center justify-between text-sm font-medium text-[#1F2547] pt-0.5">
            <label
              htmlFor={selectId}
              className="cursor-pointer inline-block leading-normal"
              onClick={() => !disabled && setIsOpen(!isOpen)}
            >
              {label}
              {requiredIndicator && <span className="text-[#E5484D] ml-1 font-semibold">* Wajib</span>}
              {optionalIndicator && <span className="text-[#8A90B0] ml-1 font-normal">(opsional)</span>}
            </label>
          </div>
        )}

        {/* Hidden native select for form submit and accessibility */}
        <select
          id={selectId}
          ref={ref}
          name={name}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {children}
        </select>

        {/* Trigger Button */}
        <button
          type="button"
          id={selectId ? `${selectId}-trigger` : undefined}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "w-full flex items-center justify-between text-left transition-all duration-200 outline-none cursor-pointer",
            sizeVariant === "sm"
              ? "h-10 px-3.5 rounded-[10px] text-xs font-medium"
              : "h-12 px-4 rounded-[14px] text-sm font-medium",
            "bg-white border border-[#E6E8F5] text-[#1F2547] shadow-[0_2px_6px_rgba(79,106,232,0.03)]",
            "hover:border-[#4F6AE8]/50 hover:bg-[#FAFBFF]",
            isOpen && "border-[#4F6AE8] ring-4 ring-[#4F6AE8]/15 bg-white",
            error && "border-[#E5484D] ring-4 ring-[#E5484D]/15",
            disabled && "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed hover:border-gray-200 hover:bg-gray-50",
            className
          )}
        >
          <span
            className={cn(
              "truncate flex-1 pr-2",
              !selectedOption || selectedOption.value === "" ? "text-[#8A90B0]" : "text-[#1F2547]"
            )}
          >
            {selectedOption && selectedOption.value !== ""
              ? selectedOption.label
              : placeholder}
          </span>

          <div
            className={cn(
              "shrink-0 text-[#8A90B0] transition-transform duration-200 flex items-center",
              isOpen && "rotate-180 text-[#4F6AE8]"
            )}
          >
            <ChevronDown className={sizeVariant === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </div>
        </button>

        {/* Floating Dropdown Menu: 100% full width on mobile, nicely bounded on desktop */}
        {isOpen && (
          <div
            role="listbox"
            className={cn(
              "absolute z-50 mt-1.5 bg-white rounded-[16px] border border-[#CCD2F0] shadow-[0_16px_40px_rgba(31,37,71,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col",
              // Mobile (<640px): 100% width, strictly bounded to trigger width
              "w-full left-0 right-0 max-w-full",
              // Desktop (>=640px): can expand comfortably based on alignment
              align === "right"
                ? "sm:left-auto sm:right-0 sm:w-auto sm:min-w-[280px] sm:max-w-md"
                : "sm:left-0 sm:right-auto sm:w-auto sm:min-w-[280px] sm:max-w-md"
            )}
          >
            {/* Scrollable List Container */}
            <div className="max-h-72 sm:max-h-80 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain">
              {options.length === 0 ? (
                <div className="py-4 px-4 text-xs text-[#8A90B0] text-center">
                  Tidak ada pilihan
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.value === currentValue;
                  const isPlaceholder = opt.value === "" && opt.label.startsWith("--");

                  return (
                    <button
                      type="button"
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs sm:text-sm font-medium text-left transition-colors cursor-pointer border-b border-[#F8F9FE] last:border-b-0",
                        isSelected
                          ? "bg-[#EEF1FF] text-[#4F6AE8] font-semibold"
                          : isPlaceholder
                          ? "text-[#8A90B0] italic hover:bg-gray-50"
                          : "text-[#1F2547] hover:bg-[#F4F5FD] hover:text-[#4F6AE8]",
                        opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      <span className="leading-relaxed break-words flex-1 pr-2">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#4F6AE8] shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Subtle footer indicator if list is long */}
            {options.length > 5 && (
              <div className="px-3 py-1.5 bg-[#F8F9FE] border-t border-[#EEF1FF] text-[10px] text-[#8A90B0] text-center font-medium">
                Gunakan scroll untuk melihat {options.length} pilihan
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-[#E5484D] mt-1 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#8A90B0] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
