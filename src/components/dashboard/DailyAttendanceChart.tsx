import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTerms } from "@/config/organization";

export interface DailyAttendancePoint {
  date: string;
  label: string;
  shortLabel: string;
  count: number;
  percentage: number;
}

export interface TrackedDayOption {
  value: number;
  label: string;
  shortLabel: string;
}

export interface DailyAttendanceChartProps {
  items: DailyAttendancePoint[];
  totalSantri: number;
  trackedDayOptions: TrackedDayOption[];
  selectedTrackedWeekdays: number[];
  onToggleTrackedWeekday: (day: number) => void;
}

export const DailyAttendanceChart: React.FC<DailyAttendanceChartProps> = ({
  items,
  totalSantri,
  trackedDayOptions,
  selectedTrackedWeekdays,
  onToggleTrackedWeekday,
}) => {
  const terms = useTerms();

  const maxCount = useMemo(() => {
    return Math.max(...items.map((item) => item.count), 1);
  }, [items]);

  const barHeight = (count: number) => {
    if (count === 0) return "4%";
    return `${Math.max((count / maxCount) * 100, 12)}%`;
  };

  const isTrackedDaySelected = (day: number) =>
    selectedTrackedWeekdays.includes(day);

  const isOnlySelectedDay = (day: number) =>
    isTrackedDaySelected(day) && selectedTrackedWeekdays.length === 1;

  const handleTrackedDayClick = (
    event: React.MouseEvent<HTMLInputElement>,
    day: number,
  ) => {
    if (isOnlySelectedDay(day)) {
      event.preventDefault();
    }
    onToggleTrackedWeekday(day);
  };

  const selectedDaySummary = useMemo(() => {
    const selectedLabels = trackedDayOptions
      .filter((day) => selectedTrackedWeekdays.includes(day.value))
      .map((day) => day.shortLabel);

    return selectedLabels.join(", ");
  }, [trackedDayOptions, selectedTrackedWeekdays]);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Grafik Kehadiran Harian</CardTitle>
        <CardDescription>
          7 tanggal terakhir sesuai hari yang dipilih
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        <details className="relative mb-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs font-medium text-foreground shadow-2xs transition hover:bg-accent/50 marker:hidden">
            <span>Hari yang di-track</span>
            <span className="truncate text-right text-xs font-semibold text-foreground">
              {selectedDaySummary}
            </span>
          </summary>

          <div
            className="absolute left-0 right-0 z-20 mt-2 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 shadow-xl sm:grid-cols-4"
            aria-label="Hari yang di-track pada grafik"
          >
            {trackedDayOptions.map((day) => (
              <label
                key={day.value}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-accent/80 ${
                  isTrackedDaySelected(day.value)
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded accent-primary"
                  checked={isTrackedDaySelected(day.value)}
                  onChange={() => {}}
                  onClick={(e) => handleTrackedDayClick(e, day.value)}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </details>

        <div className="flex h-56 items-end gap-2 rounded-xl border border-border bg-muted/50 px-3 pt-4 pb-3">
          {items.map((item) => (
            <div
              key={item.date}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.percentage}%
                </p>
              </div>

              <div
                className="flex h-32 w-full max-w-9 items-end rounded-t-lg bg-secondary/80 overflow-hidden"
                aria-label={`${item.label}: ${item.count} ${terms.studentSingularLower} hadir`}
              >
                <div
                  className="w-full rounded-t-md bg-primary transition-all duration-300"
                  style={{ height: barHeight(item.count) }}
                />
              </div>

              <p
                className="w-full truncate text-center text-[11px] font-medium text-muted-foreground"
                title={item.label}
              >
                {item.shortLabel}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Basis persentase</span>
          <span className="font-semibold text-foreground">
            {totalSantri} {terms.studentSingularLower} aktif
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyAttendanceChart;

