"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface DatePickerProps {
  label?: string;
  requiredIndicator?: boolean;
  optionalIndicator?: boolean;
  error?: string;
  helperText?: string;
  value?: string; // YYYY-MM-DD format
  onChange?: (date: string) => void;
  placeholder?: string;
  sizeVariant?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function DatePicker({
  label,
  requiredIndicator,
  optionalIndicator,
  error,
  helperText,
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  sizeVariant = "md",
  className,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or default to current date
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }, [value]);

  // View state for navigating calendar months
  const [viewYear, setViewYear] = useState<number>(
    parsedDate ? parsedDate.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsedDate ? parsedDate.getMonth() : new Date().getMonth()
  );

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [value, parsedDate]);

  // Click outside listener
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

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; currentMonth: boolean; dateStr: string }[] = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, currentMonth: false, dateStr });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, currentMonth: true, dateStr });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, currentMonth: false, dateStr });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  // Formatted date string for button display
  const displayString = useMemo(() => {
    if (!parsedDate) return placeholder;
    const d = parsedDate.getDate();
    const m = MONTH_NAMES_ID[parsedDate.getMonth()];
    const y = parsedDate.getFullYear();
    return `${d} ${m} ${y}`;
  }, [parsedDate, placeholder]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between text-sm font-medium text-[#1F2547]">
          <span className="cursor-pointer" onClick={() => !disabled && setIsOpen(!isOpen)}>
            {label}
            {requiredIndicator && <span className="text-[#E5484D] ml-1 font-semibold">* Wajib</span>}
            {optionalIndicator && <span className="text-[#8A90B0] ml-1 font-normal">(opsional)</span>}
          </span>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "w-full flex items-center justify-between text-left transition-all duration-200 outline-none cursor-pointer",
            sizeVariant === "sm"
              ? "h-10 px-3 rounded-[10px] text-xs font-medium"
              : "h-11 md:h-12 px-3.5 rounded-[14px] text-sm font-medium",
            "bg-white border border-[#E6E8F5] text-[#1F2547] shadow-[0_2px_6px_rgba(79,106,232,0.03)]",
            "hover:border-[#4F6AE8]/50 hover:bg-[#FAFBFF]",
            isOpen && "border-[#4F6AE8] ring-4 ring-[#4F6AE8]/15 bg-white",
            error && "border-[#E5484D] ring-4 ring-[#E5484D]/15",
            disabled && "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed hover:bg-gray-50",
            className
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon className={cn("text-[#4F6AE8] shrink-0", sizeVariant === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
            <span className={cn("truncate", !value ? "text-[#8A90B0]" : "text-[#1F2547] font-semibold")}>
              {displayString}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <span
                onClick={handleClear}
                className="p-1 rounded-md text-[#8A90B0] hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Hapus tanggal"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </div>
        </button>

        {/* Luxury Calendar Dropdown Popover */}
        {isOpen && (
          <div
            className={cn(
              "absolute left-0 z-50 mt-1.5 w-[310px] bg-white rounded-[20px] border border-[#E6E8F5] p-4",
              "shadow-[0_20px_50px_rgba(31,37,71,0.16),0_4px_16px_rgba(79,106,232,0.08)]",
              "animate-in fade-in zoom-in-95 duration-150 select-none"
            )}
          >
            {/* Calendar Header: Month, Year, and Nav Arrows */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-sm text-[#1F2547]">
                {MONTH_NAMES_ID[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-[#8A90B0] hover:text-[#1F2547] hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-[#8A90B0] hover:text-[#1F2547] hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_NAMES_ID.map((day) => (
                <div key={day} className="text-[11px] font-semibold text-[#8A90B0] py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((item, idx) => {
                const isSelected = item.dateStr === value;
                const isToday = item.dateStr === todayStr;

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectDay(item.dateStr)}
                    className={cn(
                      "h-8 w-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#4F6AE8] text-white font-bold shadow-md shadow-[#4F6AE8]/30 scale-105"
                        : isToday
                        ? "border border-[#4F6AE8] text-[#4F6AE8] font-semibold hover:bg-[#EEF1FF]"
                        : item.currentMonth
                        ? "text-[#1F2547] hover:bg-[#EEF1FF] hover:text-[#4F6AE8]"
                        : "text-[#C1C6DD] hover:bg-gray-50"
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-3 pt-3 border-t border-[#E6E8F5] flex items-center justify-between">
              <button
                type="button"
                onClick={handleToday}
                className="text-xs font-semibold text-[#4F6AE8] hover:underline cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-[#8A90B0] hover:text-[#1F2547] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[#E5484D] mt-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#8A90B0] mt-1">{helperText}</p>}
    </div>
  );
}

