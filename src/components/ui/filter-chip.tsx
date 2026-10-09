import React from "react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  layoutId?: string;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onClick,
  count,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-medium border transition-colors duration-150 ease-out cursor-pointer select-none",
        isActive
          ? "bg-secondary text-foreground font-semibold shadow-2xs border-border/80"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent",
        className,
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-150",
            isActive
              ? "bg-background text-foreground shadow-2xs"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default FilterChip;

