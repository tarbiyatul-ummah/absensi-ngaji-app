import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Download05Icon } from "@hugeicons/core-free-icons";
import { springSnappy, useSmoothMotion } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { LoadingState } from "@/components/ui/loading-state";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  getSppPaymentId,
  getSppPaymentsByAcademicYear,
  saveSppPayment,
} from "../services/financeService";
import {
  getAcademicYears,
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "../services/academicYearService";
import type { AcademicYear, Guru, Jilid, Santri, SppPayment } from "../types";
import {
  getAcademicMonthOptions,
  getAcademicYearLabel,
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
} from "../utils/academicPeriod";
import { Toast } from "../components/master/Toast";
import { useTerms } from "../config/organization";

const SANTRI_BATCH_SIZE = 15;

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPaymentDate = (timestamp?: number | null) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatPaymentDateTime = (timestamp?: number | null) => {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const FinanceView: React.FC = () => {
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [paymentList, setPaymentList] = useState<SppPayment[]>([]);
  const [academicYearList, setAcademicYearList] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearStart, setSelectedAcademicYearStart] = useState(
    getCurrentAcademicYearStart()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [renderedSantriCount, setRenderedSantriCount] =
    useState(SANTRI_BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [selectedSantriDetail, setSelectedSantriDetail] =
    useState<Santri | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    []
  );

  const academicYearOptions = useMemo(
    () => getAcademicYearSelectOptions(academicYearList),
    [academicYearList]
  );

  const monthOptions = useMemo(
    () => getAcademicMonthOptions(selectedAcademicYearStart),
    [selectedAcademicYearStart]
  );

  const paymentByKey = useMemo(() => {
    return paymentList.reduce(
      (acc, payment) => {
        acc[`${payment.santriId}_${payment.month}`] = payment;
        return acc;
      },
      {} as Record<string, SppPayment>
    );
  }, [paymentList]);

  const activeSantriList = useMemo(
    () =>
      santriList
        .filter((santri) => santri.isActive !== false)
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [santriList]
  );

  const jilidMap = useMemo(
    () => new Map(jilidList.map((j) => [j.id, j.nama])),
    [jilidList]
  );

  const guruMap = useMemo(
    () => new Map(guruList.map((g) => [g.id, g.nama])),
    [guruList]
  );

  const getJilidName = useCallback(
    (jilidId: string) => jilidMap.get(jilidId) ?? "-",
    [jilidMap]
  );

  const getGuruName = useCallback(
    (guruId: string) => guruMap.get(guruId) ?? "-",
    [guruMap]
  );

  // Helper untuk menentukan bulan masuk santri (format: YYYY-MM)
  const getStudentEntryMonth = useCallback((santri: Santri) => {
    if (santri.tanggalMasuk) {
      return santri.tanggalMasuk.slice(0, 7);
    }
    if (santri.createdAt) {
      return new Date(santri.createdAt).toISOString().slice(0, 7);
    }
    return "1970-01";
  }, []);

  // Cek apakah bulan tersebut sebelum tanggal murid masuk
  const isMonthBeforeEntry = useCallback(
    (santri: Santri, monthValue: string) => {
      const entryMonth = getStudentEntryMonth(santri);
      return monthValue < entryMonth;
    },
    [getStudentEntryMonth]
  );

  // Cek apakah bulan tersebut berlaku untuk santri (tidak sebelum masuk dan tidak setelah keluar)
  const isMonthApplicable = useCallback(
    (santri: Santri, monthValue: string) => {
      if (isMonthBeforeEntry(santri, monthValue)) return false;
      if (santri.tanggalKeluar) {
        const exitMonth = santri.tanggalKeluar.slice(0, 7);
        if (monthValue > exitMonth) return false;
      }
      return true;
    },
    [isMonthBeforeEntry]
  );

  // Ambil daftar bulan yang wajib dibayar oleh santri
  const getApplicableMonths = useCallback(
    (santri: Santri) => {
      return monthOptions.filter((month) =>
        isMonthApplicable(santri, month.value)
      );
    },
    [monthOptions, isMonthApplicable]
  );

  const filteredSantriList = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return activeSantriList;

    return activeSantriList.filter((santri) => {
      const searchableText = [
        santri.nama,
        getJilidName(santri.jilidId),
        getGuruName(santri.guruId),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [activeSantriList, searchQuery, getJilidName, getGuruName]);

  const visibleSantriList = useMemo(
    () => filteredSantriList.slice(0, renderedSantriCount),
    [filteredSantriList, renderedSantriCount]
  );

  const hasMoreSantri = visibleSantriList.length < filteredSantriList.length;

  const currentMonthValue = useMemo(() => getCurrentAcademicMonth(), []);

  const currentMonthLabel = useMemo(() => {
    return (
      monthOptions.find((month) => month.value === currentMonthValue)?.label ??
      "bulan ini"
    );
  }, [monthOptions, currentMonthValue]);

  const currentMonthIndex = useMemo(
    () => monthOptions.findIndex((month) => month.value === currentMonthValue),
    [monthOptions, currentMonthValue]
  );

  const previousMonthValue = useMemo(() => {
    if (currentMonthIndex <= 0) return null;
    return monthOptions[currentMonthIndex - 1]?.value ?? null;
  }, [monthOptions, currentMonthIndex]);

  const isPaid = useCallback(
    (santriId: string, month: string) => {
      return paymentByKey[`${santriId}_${month}`]?.isPaid === true;
    },
    [paymentByKey]
  );

  const getPaidCount = useCallback(
    (santriId: string) => {
      return monthOptions.filter((month) => isPaid(santriId, month.value))
        .length;
    },
    [monthOptions, isPaid]
  );

  const paidThisMonthCount = useMemo(
    () =>
      activeSantriList.filter((santri) =>
        isPaid(santri.id, currentMonthValue)
      ).length,
    [activeSantriList, isPaid, currentMonthValue]
  );

  const unpaidThisMonthCount = useMemo(
    () =>
      activeSantriList.filter(
        (santri) =>
          isMonthApplicable(santri, currentMonthValue) &&
          !isPaid(santri.id, currentMonthValue)
      ).length,
    [activeSantriList, isMonthApplicable, isPaid, currentMonthValue]
  );

  const arrearsCount = useMemo(() => {
    if (!previousMonthValue) return 0;
    return activeSantriList.filter(
      (santri) =>
        isMonthApplicable(santri, previousMonthValue) &&
        !isPaid(santri.id, previousMonthValue)
    ).length;
  }, [activeSantriList, isMonthApplicable, isPaid, previousMonthValue]);

  const formatMonthShort = (monthLabel: string) => {
    return monthLabel.split(" ")[0].slice(0, 3);
  };

  const loadPayments = useCallback(
    async (yearStart: number) => {
      setIsPaymentLoading(true);
      try {
        const payments = await getSppPaymentsByAcademicYear(yearStart);
        setPaymentList(payments);
      } catch (error) {
        triggerToast("Data pembayaran belum bisa dimuat.", "error");
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [triggerToast]
  );

  // Initial load
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const [santriRes, jilidRes, guruRes, academicYearRes] =
          await Promise.all([
            getSantri(),
            getJilid(),
            getGuru(),
            getAcademicYears().catch(() => []),
          ]);
        if (!mounted) return;
        setSantriList(santriRes);
        setJilidList(jilidRes);
        setGuruList(guruRes);
        setAcademicYearList(academicYearRes);
        const defaultYear = getDefaultAcademicYearStart(academicYearRes);
        setSelectedAcademicYearStart(defaultYear);
        await loadPayments(defaultYear);
      } catch (error) {
        if (mounted) {
          triggerToast(
            "Koneksi bermasalah. Data keuangan belum bisa dimuat.",
            "error"
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [loadPayments, triggerToast]);

  // When year changes
  const handleAcademicYearChange = (year: number) => {
    setSelectedAcademicYearStart(year);
    loadPayments(year);
  };

  // Reset rendered count when search changes
  useEffect(() => {
    setRenderedSantriCount(SANTRI_BATCH_SIZE);
  }, [searchQuery]);

  // Lazy loading observer
  useEffect(() => {
    if (!hasMoreSantri || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRenderedSantriCount((prev) =>
            Math.min(prev + SANTRI_BATCH_SIZE, filteredSantriList.length)
          );
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(loadMoreTriggerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreSantri, filteredSantriList.length]);

  const loadMoreSantri = () => {
    if (!hasMoreSantri) return;
    setRenderedSantriCount((prev) =>
      Math.min(prev + SANTRI_BATCH_SIZE, filteredSantriList.length)
    );
  };

  const togglePayment = async (santri: Santri, month: string) => {
    // Jika bulan sebelum murid masuk, batalkan
    if (isMonthBeforeEntry(santri, month)) {
      triggerToast(
        `Bulan ini dinonaktifkan karena sebelum tanggal masuk ${santri.nama}.`,
        "error"
      );
      return;
    }

    const id = getSppPaymentId(selectedAcademicYearStart, month, santri.id);
    const previousPayments = [...paymentList];
    const nextIsPaid = !isPaid(santri.id, month);
    const now = Date.now();
    const nextPayment: SppPayment = {
      id,
      santriId: santri.id,
      academicYearStart: selectedAcademicYearStart,
      month,
      isPaid: nextIsPaid,
      paidAt: nextIsPaid ? now : null,
      updatedAt: now,
    };

    setPaymentList((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = nextPayment;
        return copy;
      }
      return [...prev, nextPayment];
    });

    setSavingIds((prev) => new Set(prev).add(id));

    try {
      await saveSppPayment({
        santriId: santri.id,
        academicYearStart: selectedAcademicYearStart,
        month,
        isPaid: nextIsPaid,
        paidAt: nextPayment.paidAt,
      });
    } catch (error) {
      setPaymentList(previousPayments);
      triggerToast("Pembayaran gagal disimpan.", "error");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const exportExcel = () => {
    const rows = activeSantriList.map((santri) => {
      const applicableMonths = getApplicableMonths(santri);
      const paidCount = getPaidCount(santri.id);
      const unpaidCount = Math.max(0, applicableMonths.length - paidCount);

      const monthColumns = Object.fromEntries(
        monthOptions.map((month) => {
          if (isMonthBeforeEntry(santri, month.value)) {
            return [month.label, "Belum Masuk"];
          }
          const payment = paymentByKey[`${santri.id}_${month.value}`];
          if (payment?.isPaid) {
            const dateStr = payment.paidAt
              ? formatPaymentDate(payment.paidAt)
              : "";
            return [
              month.label,
              dateStr ? `Lunas (${dateStr})` : "Lunas",
            ];
          }
          return [month.label, "Belum Bayar"];
        })
      );

      return {
        [`Nama ${terms.studentSingularTitle}`]: santri.nama,
        [terms.levelSingularTitle]: getJilidName(santri.jilidId),
        [terms.mentorSingularTitle]: getGuruName(santri.guruId),
        "Tanggal Masuk": formatDateDisplay(santri.tanggalMasuk),
        ...monthColumns,
        "Bulan Wajib": applicableMonths.length,
        "Total Bayar": paidCount,
        "Tunggakan": unpaidCount,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    const academicYearName = getAcademicYearLabel(
      selectedAcademicYearStart
    ).replace("/", "-");

    XLSX.utils.book_append_sheet(workbook, worksheet, terms.paymentLabel);
    XLSX.writeFile(
      workbook,
      `rekap-${terms.paymentLabel.toLowerCase()}-${academicYearName}.xlsx`
    );
    triggerToast(`Data ${terms.paymentLabel} berhasil diexport.`);
  };

  return (
    <div className="app-page">
      {toastMessage && (
        <Toast
          show={!!toastMessage}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <header className="app-container-wide space-y-4 pb-4">
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.7} />
            Dashboard
          </Link>
        </Button>

        <div className="app-header">
          <div>
            <h1 className="app-title">Keuangan {terms.paymentLabel}</h1>
            <p className="app-subtitle">
              Pantau pembayaran bulanan dan tunggakan {terms.studentSingularLower}.
            </p>
          </div>
          <Button
            type="button"
            onClick={exportExcel}
            disabled={isLoading || activeSantriList.length === 0}
          >
            <HugeiconsIcon icon={Download05Icon} size={17} strokeWidth={2} />
            Export Excel
          </Button>
        </div>
      </header>

      {isLoading ? (
        <LoadingState size="lg" text="Memuat Data" />
      ) : (
        <main className="app-container-wide space-y-5 pb-28">
          <Card className="grid grid-cols-1 sm:grid-cols-3">
            <div className="border-b p-4 sm:border-b-0 sm:border-r">
              <p className="text-xs leading-snug text-muted-foreground">
                Sudah bayar bulan ini
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-tight text-success">
                {paidThisMonthCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {currentMonthLabel}
              </p>
            </div>
            <div className="border-b p-4 sm:border-b-0 sm:border-r">
              <p className="text-xs leading-snug text-muted-foreground">
                Belum bayar bulan ini
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-tight text-danger">
                {unpaidThisMonthCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Dari {activeSantriList.length} {terms.studentSingularLower} aktif
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs leading-snug text-muted-foreground">
                Jumlah menunggak
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">
                {arrearsCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Belum bayar bulan sebelumnya
              </p>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-1 gap-3 border-b p-4 md:grid-cols-[220px_1fr]">
              <div>
                <Label> Tahun Ajaran </Label>
                <Select
                  value={String(selectedAcademicYearStart)}
                  onValueChange={(val) =>
                    handleAcademicYearChange(Number(val))
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem
                        key={year.startYear}
                        value={String(year.startYear)}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Cari {terms.studentSingularTitle}</Label>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Cari nama, ${terms.levelSingularLower}, atau ${terms.mentorSingularLower}...`}
                />
              </div>
            </div>

            {isPaymentLoading && (
              <div className="border-b px-4 py-3 text-center">
                <LoadingState size="sm" text="Memuat Data" className="py-0" />
              </div>
            )}

            {/* Mobile list */}
            <div className="space-y-3 p-4 md:hidden">
              {visibleSantriList.map((santri) => (
                <article
                  key={santri.id}
                  className="rounded-lg border bg-background p-3"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedSantriDetail(santri)}
                        className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors text-left block max-w-full cursor-pointer"
                        title="Klik untuk melihat detail pembayaran"
                      >
                        {santri.nama}
                      </button>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getJilidName(santri.jilidId)} -{" "}
                        {getGuruName(santri.guruId)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {getPaidCount(santri.id)}/{getApplicableMonths(santri).length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {monthOptions.map((month) => {
                      const disabledByEntry = isMonthBeforeEntry(
                        santri,
                        month.value
                      );
                      const isItemSaving = savingIds.has(
                        getSppPaymentId(
                          selectedAcademicYearStart,
                          month.value,
                          santri.id
                        )
                      );
                      const paid = isPaid(santri.id, month.value);

                      if (disabledByEntry) {
                        return (
                          <div
                            key={`${santri.id}-${month.value}`}
                            title={`Belum masuk (Masuk: ${formatDateDisplay(santri.tanggalMasuk)})`}
                            className="flex h-12 flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-[11px] text-muted-foreground/40 cursor-not-allowed select-none"
                          >
                            <span>{formatMonthShort(month.label)}</span>
                            <span className="mt-0.5 text-[9px] text-muted-foreground/50">
                              N/A
                            </span>
                          </div>
                        );
                      }

                      return (
                        <motion.button
                          key={`${santri.id}-${month.value}`}
                          type="button"
                          whileTap={
                            shouldReduceMotion || isItemSaving
                              ? undefined
                              : { scale: 0.98 }
                          }
                          transition={springSnappy}
                          onClick={() => togglePayment(santri, month.value)}
                          disabled={isItemSaving}
                          className={`flex h-12 flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer ${
                            paid
                              ? "border-success-border bg-success-subtle text-success shadow-2xs"
                              : "border-border bg-background text-muted-foreground active:bg-accent"
                          }`}
                        >
                          <span>{formatMonthShort(month.label)}</span>
                          <span className="mt-0.5 text-[10px]">
                            {paid ? "Bayar" : "Belum"}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </article>
              ))}

              {filteredSantriList.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada {terms.studentSingularLower} yang sesuai filter.
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto pb-28 md:block">
              <table className="min-w-245 w-full border-collapse text-left text-[13px]">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 z-10 w-56 bg-muted px-4 py-3 font-semibold">
                      {terms.studentSingularTitle}
                    </th>
                    {monthOptions.map((month) => (
                      <th
                        key={month.value}
                        className="w-16 px-2 py-3 text-center font-semibold"
                      >
                        {formatMonthShort(month.label)}
                      </th>
                    ))}
                    <th className="w-24 px-3 py-3 text-right font-semibold">
                      Bayar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleSantriList.map((santri) => (
                    <tr key={santri.id} className="hover:bg-accent">
                      <td className="sticky left-0 z-10 bg-background px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSantriDetail(santri)}
                          className="font-medium text-foreground hover:text-primary transition-colors text-left block cursor-pointer hover:underline"
                          title="Klik untuk melihat detail pembayaran"
                        >
                          {santri.nama}
                        </button>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {getJilidName(santri.jilidId)} -{" "}
                          {getGuruName(santri.guruId)}
                        </p>
                      </td>
                      {monthOptions.map((month) => {
                        const disabledByEntry = isMonthBeforeEntry(
                          santri,
                          month.value
                        );
                        const isItemSaving = savingIds.has(
                          getSppPaymentId(
                            selectedAcademicYearStart,
                            month.value,
                            santri.id
                          )
                        );
                        const paid = isPaid(santri.id, month.value);

                        if (disabledByEntry) {
                          return (
                            <td
                              key={`${santri.id}-${month.value}`}
                              className="px-2 py-2 text-center"
                            >
                              <span
                                title={`Belum masuk (Masuk: ${formatDateDisplay(santri.tanggalMasuk)})`}
                                className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-[11px] text-muted-foreground/40 cursor-not-allowed select-none"
                              >
                                -
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={`${santri.id}-${month.value}`}
                            className="px-2 py-2 text-center"
                          >
                            <motion.button
                              type="button"
                              whileTap={
                                shouldReduceMotion || isItemSaving
                                  ? undefined
                                  : { scale: 0.88 }
                              }
                              transition={springSnappy}
                              onClick={() => togglePayment(santri, month.value)}
                              disabled={isItemSaving}
                              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md border text-[12px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer ${
                                paid
                                  ? "border-success-border bg-success-subtle text-success shadow-2xs"
                                  : "border-border bg-background text-muted-foreground hover:bg-accent"
                              }`}
                              aria-label={`${santri.nama} ${month.label}`}
                            >
                              {paid ? "L" : "-"}
                            </motion.button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right font-semibold text-foreground">
                        {getPaidCount(santri.id)}/{getApplicableMonths(santri).length}
                      </td>
                    </tr>
                  ))}
                  {filteredSantriList.length === 0 && (
                    <tr>
                      <td
                        colSpan={monthOptions.length + 2}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada {terms.studentSingularLower} yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasMoreSantri && (
              <div
                ref={loadMoreTriggerRef}
                className="flex items-center justify-center border-t px-4 py-4"
              >
                <Button type="button" onClick={loadMoreSantri} variant="outline">
                  Muat lagi
                </Button>
              </div>
            )}
          </Card>
        </main>
      )}

      {/* Dialog Detail Pembayaran Siswa */}
      <Dialog
        open={Boolean(selectedSantriDetail)}
        onOpenChange={(open) => !open && setSelectedSantriDetail(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Detail {terms.paymentLabel} - {selectedSantriDetail?.nama}
            </DialogTitle>
            <DialogDescription>
              Rincian status pembayaran bulanan dan tanggal pelunasan.
            </DialogDescription>
          </DialogHeader>

          {selectedSantriDetail && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">
                    {terms.levelSingularTitle}
                  </span>
                  <span className="font-semibold text-foreground">
                    {getJilidName(selectedSantriDetail.jilidId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    {terms.mentorSingularTitle}
                  </span>
                  <span className="font-semibold text-foreground">
                    {getGuruName(selectedSantriDetail.guruId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tanggal Masuk</span>
                  <span className="font-semibold text-foreground">
                    {formatDateDisplay(selectedSantriDetail.tanggalMasuk)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tahun Ajaran</span>
                  <span className="font-semibold text-foreground">
                    {getAcademicYearLabel(selectedAcademicYearStart)}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-semibold grid grid-cols-12 gap-2 text-muted-foreground">
                  <span className="col-span-4">Bulan</span>
                  <span className="col-span-3 text-center">Status</span>
                  <span className="col-span-5 text-right">Tanggal Bayar</span>
                </div>
                <div className="divide-y text-xs">
                  {monthOptions.map((month) => {
                    const disabledByEntry = isMonthBeforeEntry(
                      selectedSantriDetail,
                      month.value
                    );
                    const paid = isPaid(selectedSantriDetail.id, month.value);
                    const payment =
                      paymentByKey[`${selectedSantriDetail.id}_${month.value}`];

                    return (
                      <div
                        key={month.value}
                        className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/30"
                      >
                        <span className="col-span-4 font-medium text-foreground">
                          {month.label}
                        </span>
                        <span className="col-span-3 text-center">
                          {disabledByEntry ? (
                            <Badge variant="neutral">
                              Belum Masuk
                            </Badge>
                          ) : paid ? (
                            <Badge variant="success">
                              Lunas
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              Belum Bayar
                            </Badge>
                          )}
                        </span>
                        <span className="col-span-5 text-right text-muted-foreground font-mono text-[11px]">
                          {disabledByEntry
                            ? "-"
                            : paid && payment?.paidAt
                            ? formatPaymentDateTime(payment.paidAt)
                            : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 px-1 text-muted-foreground border-t">
                <span>
                  Bulan Wajib:{" "}
                  <strong className="text-foreground">
                    {getApplicableMonths(selectedSantriDetail).length}
                  </strong>
                </span>
                <span>
                  Sudah Bayar:{" "}
                  <strong className="text-success">
                    {getPaidCount(selectedSantriDetail.id)}
                  </strong>
                </span>
                <span>
                  Sisa Tagihan:{" "}
                  <strong className="text-danger">
                    {Math.max(
                      0,
                      getApplicableMonths(selectedSantriDetail).length -
                        getPaidCount(selectedSantriDetail.id)
                    )}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceView;
