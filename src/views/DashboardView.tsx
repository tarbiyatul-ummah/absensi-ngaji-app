import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckListIcon,
  ChartEvaluationIcon,
  DatabaseIcon,
  Wallet01Icon,
  AddMoneyCircleIcon,
} from "@hugeicons/core-free-icons";
import { ChevronRight } from "lucide-react";
import { springSnappy, useSmoothMotion } from "@/lib/motion";
import { getSantri } from "@/services/masterService";
import { getAttendanceByDateRange } from "@/services/attendanceService";
import {
  getAcademicYears,
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "@/services/academicYearService";
import type { AcademicYear, Attendance, Santri } from "@/types";
import { useTerms } from "@/config/organization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatisticCard from "@/components/dashboard/StatisticCard";
import StatisticListCard from "@/components/dashboard/StatisticListCard";
import DailyAttendanceChart, {
  type TrackedDayOption,
} from "@/components/dashboard/DailyAttendanceChart";
import Toast from "@/components/master/Toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import {
  type AcademicPeriodType,
  type AcademicSemester,
  formatDateInput,
  formatDateLong,
  getAcademicMonthOptions,
  getAcademicPeriodRange,
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
  getCurrentSemester,
  getPeriodLabel,
} from "@/utils/academicPeriod";

const trackedDayOptions: TrackedDayOption[] = [
  { value: 1, label: "Senin", shortLabel: "Sen" },
  { value: 2, label: "Selasa", shortLabel: "Sel" },
  { value: 3, label: "Rabu", shortLabel: "Rab" },
  { value: 4, label: "Kamis", shortLabel: "Kam" },
  { value: 5, label: "Jumat", shortLabel: "Jum" },
  { value: 6, label: "Sabtu", shortLabel: "Sab" },
  { value: 0, label: "Minggu", shortLabel: "Min" },
];

export const DashboardView: React.FC = () => {
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [weeklyAttendanceList, setWeeklyAttendanceList] = useState<Attendance[]>(
    [],
  );
  const [academicYearList, setAcademicYearList] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [selectedPeriodType, setSelectedPeriodType] =
    useState<AcademicPeriodType>("semester");
  const [selectedAcademicYearStart, setSelectedAcademicYearStart] = useState(
    () => getCurrentAcademicYearStart(),
  );
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester>(
    () => getCurrentSemester(),
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getCurrentAcademicMonth(),
  );
  const [selectedTrackedWeekdays, setSelectedTrackedWeekdays] = useState<
    number[]
  >([1, 2, 3, 4, 5]);

  const triggerToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    });
  };

  const formatLongDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getLastTrackedDates = useCallback(
    (totalDays: number) => {
      const dates: Date[] = [];
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      const trackedWeekdays =
        selectedTrackedWeekdays.length > 0
          ? new Set(selectedTrackedWeekdays)
          : new Set([1, 2, 3, 4, 5]);

      while (dates.length < totalDays) {
        if (trackedWeekdays.has(cursor.getDay())) {
          dates.unshift(new Date(cursor));
        }
        cursor.setDate(cursor.getDate() - 1);
      }

      return dates;
    },
    [selectedTrackedWeekdays],
  );

  const isAttendancePresent = (attendance: Attendance) => {
    const status =
      attendance.status ?? (attendance.isPresent ? "present" : "absent");
    return status === "present";
  };

  const academicYearOptions = useMemo(
    () => getAcademicYearSelectOptions(academicYearList),
    [academicYearList],
  );

  const academicMonthOptions = useMemo(
    () => getAcademicMonthOptions(selectedAcademicYearStart),
    [selectedAcademicYearStart],
  );

  const selectedDateRange = useMemo(() => {
    if (selectedPeriodType === "custom") {
      return getAcademicPeriodRange(
        "semester",
        selectedAcademicYearStart,
        selectedSemester,
        selectedMonth,
      );
    }
    return getAcademicPeriodRange(
      selectedPeriodType,
      selectedAcademicYearStart,
      selectedSemester,
      selectedMonth,
    );
  }, [
    selectedPeriodType,
    selectedAcademicYearStart,
    selectedSemester,
    selectedMonth,
  ]);

  const selectedPeriodLabel = useMemo(
    () =>
      getPeriodLabel(
        selectedPeriodType,
        selectedAcademicYearStart,
        selectedSemester,
        selectedMonth,
        selectedDateRange.start,
        selectedDateRange.end,
      ),
    [
      selectedPeriodType,
      selectedAcademicYearStart,
      selectedSemester,
      selectedMonth,
      selectedDateRange,
    ],
  );

  const selectedDateRangeLabel = useMemo(
    () =>
      `${formatDateLong(selectedDateRange.start)} - ${formatDateLong(
        selectedDateRange.end,
      )}`,
    [selectedDateRange],
  );

  const loadWeeklyAttendance = useCallback(async () => {
    const endDate = new Date();
    const trackedDates = getLastTrackedDates(7);
    const startDate = trackedDates[0] ?? endDate;

    try {
      const list = await getAttendanceByDateRange(
        formatDateInput(startDate),
        formatDateInput(endDate),
      );
      setWeeklyAttendanceList(list);
    } catch {
      triggerToast("Koneksi bermasalah. Grafik belum bisa dimuat.");
    }
  }, [getLastTrackedDates, triggerToast]);

  const loadPeriodAttendance = useCallback(async () => {
    setIsAttendanceLoading(true);
    try {
      const list = await getAttendanceByDateRange(
        selectedDateRange.start,
        selectedDateRange.end,
      );
      setAttendanceList(list);
    } catch {
      triggerToast("Koneksi bermasalah. Data kehadiran belum bisa dimuat.");
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [selectedDateRange, triggerToast]);

  const handleAcademicYearChange = (value: string) => {
    const year = Number(value);
    setSelectedAcademicYearStart(year);
    const monthOptions = getAcademicMonthOptions(year);
    if (monthOptions[0]) {
      setSelectedMonth(monthOptions[0].value);
    }
  };

  const toggleTrackedWeekday = (day: number) => {
    setSelectedTrackedWeekdays((currentDays) => {
      if (currentDays.includes(day)) {
        if (currentDays.length === 1) {
          triggerToast("Minimal pilih 1 hari untuk grafik.");
          return currentDays;
        }
        return currentDays.filter((d) => d !== day);
      }
      return [...currentDays, day].sort((a, b) => {
        const dayOrder = [1, 2, 3, 4, 5, 6, 0];
        return dayOrder.indexOf(a) - dayOrder.indexOf(b);
      });
    });
  };

  // Initial mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [resSantri, academicYearRes] = await Promise.all([
          getSantri(),
          getAcademicYears().catch(() => []),
        ]);
        if (!isMounted) return;
        setSantriList(resSantri.filter((s) => s.isActive !== false));
        setAcademicYearList(academicYearRes);
        const defYear = getDefaultAcademicYearStart(academicYearRes);
        setSelectedAcademicYearStart(defYear);
        const monthOptions = getAcademicMonthOptions(defYear);
        if (monthOptions[0]) {
          setSelectedMonth(monthOptions[0].value);
        }
      } catch {
        if (isMounted) {
          triggerToast("Koneksi bermasalah. Dashboard belum bisa dimuat.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void init();
    return () => {
      isMounted = false;
    };
  }, [triggerToast]);

  // Load period attendance when range changes
  useEffect(() => {
    if (!isLoading) {
      void loadPeriodAttendance();
    }
  }, [isLoading, loadPeriodAttendance]);

  // Load weekly attendance when weekdays filter changes
  useEffect(() => {
    if (!isLoading) {
      void loadWeeklyAttendance();
    }
  }, [isLoading, loadWeeklyAttendance]);

  const totalSantri = santriList.length;

  const activeSantriIds = useMemo(
    () => new Set(santriList.map((s) => s.id)),
    [santriList],
  );

  const getSantriStartDate = (santri: Santri) => {
    if (!santri.createdAt) return selectedDateRange.start;
    const createdAtDate = new Date(santri.createdAt);
    if (Number.isNaN(createdAtDate.getTime())) return selectedDateRange.start;
    const createdAtDateKey = formatDateInput(createdAtDate);
    return createdAtDateKey > selectedDateRange.start
      ? createdAtDateKey
      : selectedDateRange.start;
  };

  const periodAttendanceDates = useMemo(
    () => [...new Set(attendanceList.map((a) => a.date))],
    [attendanceList],
  );

  const attendanceStats = useMemo(() => {
    const presentDatesBySantri = attendanceList.reduce(
      (acc, attendance) => {
        if (
          activeSantriIds.has(attendance.santriId) &&
          isAttendancePresent(attendance)
        ) {
          if (!acc[attendance.santriId]) acc[attendance.santriId] = new Set();
          acc[attendance.santriId].add(attendance.date);
        }
        return acc;
      },
      {} as Record<string, Set<string>>,
    );

    return santriList.map((santri) => {
      const santriStartDate = getSantriStartDate(santri);
      const eligibleAttendanceDates = periodAttendanceDates.filter(
        (date) => date >= santriStartDate,
      );
      const presentCount =
        presentDatesBySantri[santri.id] &&
        [...presentDatesBySantri[santri.id]].filter(
          (date) => date >= santriStartDate,
        ).length;
      const missedCount = Math.max(
        eligibleAttendanceDates.length - (presentCount || 0),
        0,
      );

      return {
        nama: santri.nama,
        presentCount: presentCount || 0,
        missedCount,
      };
    });
  }, [santriList, attendanceList, activeSantriIds, periodAttendanceDates]);

  const santriTidakMasukTerbanyak = useMemo(() => {
    return [...attendanceStats]
      .sort(
        (a, b) =>
          b.missedCount - a.missedCount ||
          a.presentCount - b.presentCount ||
          a.nama.localeCompare(b.nama),
      )
      .map((item) => ({ nama: item.nama, count: item.missedCount }))
      .slice(0, 5);
  }, [attendanceStats]);

  const santriPalingAktif = useMemo(() => {
    return [...attendanceStats]
      .sort(
        (a, b) =>
          b.presentCount - a.presentCount ||
          a.missedCount - b.missedCount ||
          a.nama.localeCompare(b.nama),
      )
      .map((item) => ({ nama: item.nama, count: item.presentCount }))
      .slice(0, 5);
  }, [attendanceStats]);

  const weeklyAttendanceChart = useMemo(() => {
    return getLastTrackedDates(7).map((date) => {
      const dateKey = formatDateInput(date);
      const count = weeklyAttendanceList.filter(
        (attendance) =>
          attendance.date === dateKey &&
          activeSantriIds.has(attendance.santriId) &&
          isAttendancePresent(attendance),
      ).length;
      const percentage =
        totalSantri > 0 ? Math.round((count / totalSantri) * 100) : 0;

      return {
        date: dateKey,
        label: formatLongDate(date),
        shortLabel: formatShortDate(date),
        count,
        percentage,
      };
    });
  }, [
    getLastTrackedDates,
    weeklyAttendanceList,
    activeSantriIds,
    totalSantri,
  ]);

  const avgWeeklyPercentage = useMemo(() => {
    if (weeklyAttendanceChart.length === 0) return 0;
    const sum = weeklyAttendanceChart.reduce(
      (acc, curr) => acc + curr.percentage,
      0,
    );
    return Math.round(sum / weeklyAttendanceChart.length);
  }, [weeklyAttendanceChart]);

  return (
    <div className="app-page">
      <Toast
        show={showToast}
        message={toastMessage}
        type="error"
        onClose={() => setShowToast(false)}
      />

      <PageHeader
        title="Dashboard Rekap"
        subtitle={`Ringkasan data ${terms.studentSingularLower} aktif dan kehadiran per periode`}
      />

      {isLoading ? (
        <LoadingState size="lg" text="Memuat Data" />
      ) : (
        <div className="app-container space-y-6">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatisticCard
              title={`Total ${terms.studentSingularTitle}`}
              value={totalSantri}
              subtitle="Status aktif terdaftar"
              icon={<HugeiconsIcon icon={DatabaseIcon} size={22} />}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatisticCard
              title="Kehadiran Pekan Ini"
              value={`${avgWeeklyPercentage}%`}
              subtitle="Rata-rata 7 hari aktif"
              icon={<HugeiconsIcon icon={CheckListIcon} size={22} />}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatisticCard
              title="Sesi Presensi"
              value={periodAttendanceDates.length}
              subtitle={selectedPeriodLabel}
              icon={<HugeiconsIcon icon={ChartEvaluationIcon} size={22} />}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
          </div>

          {/* Akses Cepat Modul: SPP, Tabungan, Penilaian */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Modul Utama
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                transition={springSnappy}
              >
                <Link
                  to="/keuangan"
                  className="group flex items-center gap-3.5 p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-sm hover:border-success-border/60 transition-colors cursor-pointer h-full"
                >
                  <div className="size-11 rounded-xl bg-success-subtle text-success flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={Wallet01Icon} size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {terms.paymentLabel} (Keuangan)
                      </h3>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      Tagihan, status bayar & invoice
                    </p>
                  </div>
                </Link>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                transition={springSnappy}
              >
                <Link
                  to="/tabungan"
                  className="group flex items-center gap-3.5 p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-sm hover:border-primary/40 transition-colors cursor-pointer h-full"
                >
                  <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={AddMoneyCircleIcon} size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Tabungan {terms.studentSingularTitle}
                      </h3>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      Buku saldo, setoran & penarikan
                    </p>
                  </div>
                </Link>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                transition={springSnappy}
              >
                <Link
                  to="/penilaian"
                  className="group flex items-center gap-3.5 p-4 rounded-xl border border-border bg-card shadow-xs hover:shadow-sm hover:border-accent-foreground/30 transition-colors cursor-pointer h-full"
                >
                  <div className="size-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HugeiconsIcon icon={ChartEvaluationIcon} size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Penilaian & Raport
                      </h3>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      Evaluasi hafalan & rapor santri
                    </p>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>

          <DailyAttendanceChart
            items={weeklyAttendanceChart}
            totalSantri={totalSantri}
            trackedDayOptions={trackedDayOptions}
            selectedTrackedWeekdays={selectedTrackedWeekdays}
            onToggleTrackedWeekday={toggleTrackedWeekday}
          />

          <Card className="gap-0 px-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    Periode Ranking
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {selectedPeriodLabel} - {selectedDateRangeLabel}
                  </p>
                </div>

                <div className="inline-flex h-9 w-fit max-w-full shrink-0 items-center overflow-x-auto rounded-xl bg-muted p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-7 rounded-lg px-3 text-xs ${
                      selectedPeriodType === "academicYear"
                        ? "bg-card text-foreground shadow-xs hover:bg-card font-medium"
                        : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                    }`}
                    onClick={() => setSelectedPeriodType("academicYear")}
                  >
                    Tahun Ajaran
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-7 rounded-lg px-3 text-xs ${
                      selectedPeriodType === "semester"
                        ? "bg-card text-foreground shadow-xs hover:bg-card font-medium"
                        : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                    }`}
                    onClick={() => setSelectedPeriodType("semester")}
                  >
                    Semester
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-7 rounded-lg px-3 text-xs ${
                      selectedPeriodType === "month"
                        ? "bg-card text-foreground shadow-xs hover:bg-card font-medium"
                        : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                    }`}
                    onClick={() => setSelectedPeriodType("month")}
                  >
                    Bulanan
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-[150px] sm:w-40">
                  <Label className="mb-1.5 text-xs">Tahun Ajaran</Label>
                  <Select
                    value={String(selectedAcademicYearStart)}
                    onValueChange={(val) => handleAcademicYearChange(val)}
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

                {selectedPeriodType === "semester" && (
                  <div className="min-w-[130px] sm:w-36">
                    <Label className="mb-1.5 text-xs">Semester</Label>
                    <Select
                      value={selectedSemester}
                      onValueChange={(val) =>
                        setSelectedSemester(val as AcademicSemester)
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ganjil">Ganjil</SelectItem>
                        <SelectItem value="genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPeriodType === "month" && (
                  <div className="min-w-[160px] sm:w-44">
                    <Label className="mb-1.5 text-xs">Bulan</Label>
                    <Select
                      value={selectedMonth}
                      onValueChange={(val) => setSelectedMonth(val)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {academicMonthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {isAttendanceLoading && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center shadow-xs">
              <LoadingState size="sm" text="Memuat Data" className="py-0" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatisticListCard
              title="Tidak Masuk Terbanyak"
              items={santriTidakMasukTerbanyak}
              badgeColor="red"
              unit="Kali"
            />

            <StatisticListCard
              title={`${terms.studentSingularTitle} Paling Aktif`}
              items={santriPalingAktif}
              badgeColor="green"
              unit="Kali"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;

