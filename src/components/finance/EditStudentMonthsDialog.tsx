import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Delete02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import type { FeeCategoryItem, InvoiceStudentItem } from "@/types";
import type { AcademicMonthOption } from "@/utils/academicPeriod";
import { formatMonthLabel, formatRupiah } from "@/utils/invoiceUtils";

interface EditStudentMonthsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentItem: InvoiceStudentItem | null;
  academicMonths: AcademicMonthOption[];
  feeCategories?: FeeCategoryItem[];
  isMonthPaid?: (santriId: string, monthValue: string) => boolean;
  onSave: (updatedItem: InvoiceStudentItem) => void;
  onRemove?: (santriId: string) => void;
}

export const EditStudentMonthsDialog: React.FC<EditStudentMonthsDialogProps> = ({
  open,
  onOpenChange,
  studentItem,
  academicMonths,
  feeCategories = [],
  isMonthPaid,
  onSave,
  onRemove,
}) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number>(0);

  useEffect(() => {
    if (studentItem && open) {
      setSelectedMonths(studentItem.months || []);
      setMonthlyFee(studentItem.monthlyFee || 0);
    }
  }, [studentItem, open]);

  if (!studentItem) return null;

  const toggleMonth = (monthValue: string) => {
    setSelectedMonths((prev) =>
      prev.includes(monthValue)
        ? prev.filter((m) => m !== monthValue)
        : [...prev, monthValue].sort(),
    );
  };

  const handleSelectAll = () => {
    setSelectedMonths(academicMonths.map((m) => m.value));
  };

  const handleClearAll = () => {
    setSelectedMonths([]);
  };

  const handleSave = () => {
    if (selectedMonths.length === 0) return;

    onSave({
      ...studentItem,
      months: selectedMonths,
      monthlyFee: Number(monthlyFee) || 0,
      subtotal: selectedMonths.length * (Number(monthlyFee) || 0),
    });

    onOpenChange(false);
  };

  const subtotal = selectedMonths.length * (Number(monthlyFee) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">
                Ubah Bulan Tagihan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Santri: <span className="font-semibold text-foreground">{studentItem.santriNama}</span> ({studentItem.jilidNama || "-"})
              </DialogDescription>
            </div>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                onClick={() => {
                  onRemove(studentItem.santriId);
                  onOpenChange(false);
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                Hapus Baris
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Month Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Bulan Ditagihkan ({selectedMonths.length} bulan)
              </Label>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-[11px]"
                >
                  Pilih Semua
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-[11px] text-muted-foreground"
                >
                  Batal Pilih
                </Button>
              </div>
            </div>

            {/* Grid of Months */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {academicMonths.map((m) => {
                const isSelected = selectedMonths.includes(m.value);
                const isAlreadyPaid = isMonthPaid
                  ? isMonthPaid(studentItem.santriId, m.value)
                  : false;

                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMonth(m.value)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border/80 bg-background hover:bg-accent/40 text-foreground"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className="text-xs truncate">{m.label}</p>
                      {isAlreadyPaid && (
                        <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                          Sudah Lunas
                        </span>
                      )}
                    </div>
                    <div
                      className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-[10px] font-bold leading-none">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Fee Input with Multi-Tariff Presets */}
          <div className="rounded-lg border p-3.5 space-y-2.5 bg-card">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-monthly-fee" className="text-xs font-semibold">
                Tarif Tagihan Per Bulan
              </Label>
              <span className="text-xs text-muted-foreground">
                Dipilih: {formatRupiah(monthlyFee)}/bln
              </span>
            </div>

            {/* Multi-Tariff Presets (Reguler, Tahfidz, dsb.) */}
            {feeCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground mr-1">
                  Pilihan Tarif:
                </span>
                {feeCategories.map((cat) => {
                  const isActive = monthlyFee === cat.amount;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMonthlyFee(cat.amount)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                          : "bg-muted/40 text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {cat.name}: {formatRupiah(cat.amount)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="edit-monthly-fee"
                type="number"
                min={0}
                step={5000}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                className="pl-9 font-semibold text-sm"
              />
            </div>
          </div>

          {/* Subtotal Preview */}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">
                Subtotal Santri Ini:
              </span>
              <span className="text-xs font-medium text-foreground">
                {selectedMonths.length} bulan × {formatRupiah(monthlyFee)}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-base text-primary">
                {formatRupiah(subtotal)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10 sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={selectedMonths.length === 0 || monthlyFee <= 0}
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

