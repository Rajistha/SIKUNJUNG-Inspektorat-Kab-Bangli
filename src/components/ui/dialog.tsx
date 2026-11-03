"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2547]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg bg-white rounded-[18px] sm:rounded-[20px] shadow-2xl border border-[#E6E8F5] p-4 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col",
          className
        )}
      >
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-[#E6E8F5] gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-[#1F2547] leading-snug">{title}</h3>
            {description && <p className="text-xs sm:text-sm text-[#8A90B0] mt-0.5 leading-normal">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A90B0] hover:text-[#1F2547] hover:bg-[#EEF1FF] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 sm:mt-4 overflow-y-auto overscroll-contain pr-1 flex-1">{children}</div>
      </div>
    </div>
  );
}

