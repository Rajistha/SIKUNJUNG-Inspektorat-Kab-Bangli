import React from "react";
import { cn, statusColor, statusLabel } from "@/lib/utils";
import { Status } from "@/lib/types";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusColor(status);
  const label = statusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0",
        config.bg,
        config.text,
        status === "menunggu_foto" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "tercatat" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        status === "tidak_diverifikasi" && "border-rose-200 bg-rose-50 text-rose-800",
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          status === "menunggu_foto" && "bg-amber-500 animate-pulse",
          status === "tercatat" && "bg-emerald-500",
          status === "tidak_diverifikasi" && "bg-rose-500"
        )}
      />
      {label}
    </span>
  );
}

