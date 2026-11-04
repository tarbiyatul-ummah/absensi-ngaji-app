import React, { useState, useMemo, useEffect } from "react";
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
import { SearchInput } from "@/components/ui/search-input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  PlusSignIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { FeeCategoryItem, InvoiceStudentItem, Santri, SantriType } from "@/types";
import type { AcademicMonthOption } from "@/utils/academicPeriod";
import { formatMonthLabel, formatRupiah } from "@/utils/invoiceUtils";

interface AddStudentInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  santriList: Santri[];
  jilidMap: Map<string, string>;
  academicMonths: AcademicMonthOption[];
  defaultMonthlyFee: number;
  feeCategories?: FeeCategoryItem[];
  santriTypes?: SantriType[];
  existingStudentIds: string[];
  isMonthApplicable: (santri: Santri, monthValue: string) => boolean;
  isMonthPaid: (santriId: string, monthValue: string) => boolean;
  onAddStudent: (item: InvoiceStudentItem) => void;
}

export const AddStudentInvoiceDialog: React.FC<AddStudentInvoiceDialogProps> = ({
  open,
  onOpenChange,
  santriList,
  jilidMap,
  academicMonths,
  defaultMonthlyFee,
  feeCategories = [],
  santriTypes = [],
  existingStudentIds,
  isMonthApplicable,
  isMonthPaid,
  onAddStudent,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number>(defaultMonthlyFee);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery("");
      setSelectedSantri(null);
      setSelectedMonths([]);
      setMonthlyFee(defaultMonthlyFee || 50000);
    }
  }, [open, defaultMonthlyFee]);

  // Filter santri for Step 1
  const filteredSantri = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return santriList
      .filter((s) => s.isActive !== false)
      .filter((s) => {
        if (!q) return true;
        const matchName = s.nama.toLowerCase().includes(q);
        const matchJilid = (jilidMap.get(s.jilidId) || "")
          .toLowerCase()
          .includes(q);
        return matchName || matchJilid;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [santriList, searchQuery, jilidMap]);

  // Handle santri selection -> transition to Step 2
  const handleSelectSantri = (santri: Santri) => {
    setSelectedSantri(santri);

    // Auto-select unpaid months applicable for this student
    const applicable = academicMonths.filter((m) =>
      isMonthApplicable(santri, m.value),
    );
    const unpaid = applicable
      .filter((m) => !isMonthPaid(santri.id, m.value))
      .map((m) => m.value);

    // If all are paid or none found, pick the first applicable month
    const initialMonths =
      unpaid.length > 0
        ? unpaid
        : applicable.length > 0
          ? [applicable[0].value]
          : [];

    setSelectedMonths(initialMonths);

    // Tentukan tarif awal secara cerdas berdasarkan tipe santri atau kategori tarif default
    let initialFee = defaultMonthlyFee || 50000;
    if (feeCategories.length > 0) {
      if (santri.tipeId) {
        const matchedByTipe = feeCategories.find(
          (f) => f.santriTypeId === santri.tipeId,
        );
        if (matchedByTipe) {
          initialFee = matchedByTipe.amount;
        } else {
          const defaultCat = feeCategories.find((f) => f.isDefault) || feeCategories[0];
          if (defaultCat) initialFee = defaultCat.amount;
        }
      } else {
        const defaultCat = feeCategories.find((f) => f.isDefault) || feeCategories[0];
        if (defaultCat) initialFee = defaultCat.amount;
      }
    }

    setMonthlyFee(initialFee);
    setStep(2);
  };

  const toggleMonth = (monthValue: string) => {
    setSelectedMonths((prev) =>
      prev.includes(monthValue)
        ? prev.filter((m) => m !== monthValue)
        : [...prev, monthValue].sort(),
    );
  };

  const handleSelectAllUnpaid = () => {
    if (!selectedSantri) return;
    const unpaid = academicMonths
      .filter((m) => isMonthApplicable(selectedSantri, m.value))
      .filter((m) => !isMonthPaid(selectedSantri.id, m.value))
      .map((m) => m.value);
    setSelectedMonths(unpaid);
  };

  const handleSelectAll = () => {
    if (!selectedSantri) return;
    const all = academicMonths
      .filter((m) => isMonthApplicable(selectedSantri, m.value))
      .map((m) => m.value);
    setSelectedMonths(all);
  };

  const handleClearMonths = () => {
    setSelectedMonths([]);
  };

  const handleConfirmAdd = () => {
    if (!selectedSantri) return;
    if (selectedMonths.length === 0) return;

    onAddStudent({
      santriId: selectedSantri.id,
      santriNama: selectedSantri.nama,
      jilidNama: jilidMap.get(selectedSantri.jilidId) || "-",
      months: selectedMonths,
      monthlyFee: Number(monthlyFee) || 0,
      subtotal: selectedMonths.length * (Number(monthlyFee) || 0),
    });

    onOpenChange(false);
  };

  const subtotal = selectedMonths.length * (Number(monthlyFee) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden sm:rounded-2xl">
        {step === 1 ? (
          <>
            <DialogHeader className="p-5 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                <DialogTitle className="text-base font-semibold">
                  Pilih Santri
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Cari dan klik santri yang ingin ditambahkan ke tagihan invoice.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-3">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari berdasarkan nama atau jilid santri..."
                autoFocus
              />

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                {filteredSantri.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Tidak ada santri yang sesuai pencarian.
                  </div>
                ) : (
                  filteredSantri.map((santri) => {
                    const isAlreadyAdded = existingStudentIds.includes(santri.id);
                    const jilid = jilidMap.get(santri.jilidId) || "-";

                    return (
                      <button
                        key={santri.id}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleSelectSantri(santri)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors pt-2.5 ${
                          isAlreadyAdded
                            ? "opacity-50 cursor-not-allowed bg-muted/20"
                            : "hover:bg-accent/60 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserIcon} size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {santri.nama}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tingkatan / Jilid: <span className="font-medium">{jilid}</span>
                            </p>
                          </div>
                        </div>

                        <div>
                          {isAlreadyAdded ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Sudah di tagihan
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px] font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                              Pilih →
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-muted/10 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-5 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                <DialogTitle className="text-base font-semibold">
                  Atur Bulan & Tarif Tagihan
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Tentukan bulan yang ditagihkan untuk santri terpilih.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Santri Card */}
              {selectedSantri && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {selectedSantri.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {selectedSantri.nama}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Tingkat:{" "}
                        <span className="font-medium text-foreground">
                          {jilidMap.get(selectedSantri.jilidId) || "-"}
                        </span>
                        {selectedSantri.tipeId && (
                          <span className="ml-2 inline-block rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                            {santriTypes.find((t) => t.id === selectedSantri.tipeId)?.nama || "Tipe Khusus"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Month Selection */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <Label className="text-xs font-semibold">
                    Pilih Bulan ({selectedMonths.length} bulan terpilih)
                  </Label>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllUnpaid}
                      className="h-6 px-2 text-[11px]"
                    >
                      Belum Lunas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-6 px-2 text-[11px]"
                    >
                      Semua
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearMonths}
                      className="h-6 px-2 text-[11px] text-muted-foreground"
                    >
                      Batal Pilih
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {academicMonths
                    .filter(
                      (m) =>
                        selectedSantri && isMonthApplicable(selectedSantri, m.value),
                    )
                    .map((m) => {
                      const isSelected = selectedMonths.includes(m.value);
                      const isAlreadyPaid = selectedSantri
                        ? isMonthPaid(selectedSantri.id, m.value)
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
                              <span className="text-[10px] font-bold leading-none">
                                ✓
                              </span>
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
                  <Label htmlFor="add-monthly-fee" className="text-xs font-semibold">
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
                    id="add-monthly-fee"
                    type="number"
                    min={0}
                    step={5000}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                    className="pl-9 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Live Subtotal Preview */}
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

            <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
                Kembali
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmAdd}
                disabled={selectedMonths.length === 0 || monthlyFee <= 0}
                className="gap-1.5"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={15} />
                Tambahkan ke Tagihan
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
