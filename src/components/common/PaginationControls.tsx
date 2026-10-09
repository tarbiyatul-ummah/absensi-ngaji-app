import React from "react";
import { Button } from "@/components/ui/button";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  visibleStart: number;
  visibleEnd: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  visibleStart,
  visibleEnd,
  itemLabel = "data",
  onPageChange,
}) => {
  if (totalItems <= 0) return null;

  return (
    <div className="p-4 border-t border-border flex flex-col gap-3 bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-muted-foreground">
        Menampilkan {visibleStart}-{visibleEnd} dari {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Sebelumnya
        </Button>
        <span className="text-[13px] text-muted-foreground">
          Halaman {currentPage} / {totalPages || 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;

