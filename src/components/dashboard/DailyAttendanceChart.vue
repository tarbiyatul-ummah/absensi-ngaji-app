<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { terms } from "../../config/organization";

interface DailyAttendancePoint {
  date: string;
  label: string;
  shortLabel: string;
  count: number;
  percentage: number;
}

interface TrackedDayOption {
  value: number;
  label: string;
  shortLabel: string;
}

const props = defineProps<{
  items: DailyAttendancePoint[];
  totalSantri: number;
  trackedDayOptions: TrackedDayOption[];
  selectedTrackedWeekdays: number[];
}>();

const emit = defineEmits<{
  (e: "toggleTrackedWeekday", day: number): void;
}>();

const maxCount = () => Math.max(...props.items.map((item) => item.count), 1);

const barHeight = (count: number) => {
  if (count === 0) return "4%";
  return `${Math.max((count / maxCount()) * 100, 12)}%`;
};

const isTrackedDaySelected = (day: number) =>
  props.selectedTrackedWeekdays.includes(day);

const isOnlySelectedDay = (day: number) =>
  isTrackedDaySelected(day) && props.selectedTrackedWeekdays.length === 1;

const handleTrackedDayClick = (event: MouseEvent, day: number) => {
  if (isOnlySelectedDay(day)) {
    event.preventDefault();
  }

  emit("toggleTrackedWeekday", day);
};

const selectedDaySummary = () => {
  const selectedLabels = props.trackedDayOptions
    .filter((day) => isTrackedDaySelected(day.value))
    .map((day) => day.shortLabel);

  return selectedLabels.join(", ");
};
</script>

<template>
  <Card class="gap-0 py-0">
    <CardHeader class="border-b py-4">
      <CardTitle>
        Grafik Kehadiran Harian
      </CardTitle>
      <CardDescription>
        7 tanggal terakhir sesuai hari yang dipilih
      </CardDescription>
    </CardHeader>

    <CardContent class="p-4">
      <details class="relative mb-4">
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md border bg-background px-3 py-2.5 text-[13px] font-medium text-foreground marker:hidden"
        >
          <span>Hari yang di-track</span>
          <span class="truncate text-right text-xs font-semibold text-foreground">
            {{ selectedDaySummary() }}
          </span>
        </summary>

        <div
          class="absolute left-0 right-0 z-20 mt-2 grid grid-cols-2 gap-2 rounded-md border bg-popover p-2 shadow-lg sm:grid-cols-4"
          aria-label="Hari yang di-track pada grafik"
        >
          <label
            v-for="day in trackedDayOptions"
            :key="day.value"
            class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium transition-colors hover:bg-accent"
            :class="
              isTrackedDaySelected(day.value)
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground'
            "
          >
            <input
              type="checkbox"
              class="h-4 w-4 shrink-0 accent-primary"
              :checked="isTrackedDaySelected(day.value)"
              @click="handleTrackedDayClick($event, day.value)"
            />
            <span>{{ day.label }}</span>
          </label>
        </div>
      </details>

      <div
        class="flex h-56 items-end gap-2 rounded-md border bg-muted px-3 pt-4 pb-3"
      >
        <div
          v-for="item in items"
          :key="item.date"
          class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <div class="text-center">
            <p class="text-xs font-bold text-foreground">
              {{ item.count }}
            </p>
            <p class="text-[10px] text-muted-foreground">
              {{ item.percentage }}%
            </p>
          </div>

          <div
            class="flex h-32 w-full max-w-9 items-end rounded bg-secondary"
            :aria-label="`${item.label}: ${item.count} ${terms.studentSingularLower} hadir`"
          >
            <div
              class="w-full rounded bg-primary transition-all"
              :style="{ height: barHeight(item.count) }"
            ></div>
          </div>

          <p
            class="w-full truncate text-center text-[11px] font-medium text-muted-foreground"
            :title="item.label"
          >
            {{ item.shortLabel }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between text-[12px]">
        <span class="text-muted-foreground">Basis persentase</span>
        <span class="font-semibold text-foreground">
          {{ totalSantri }} {{ terms.studentSingularLower }} aktif
        </span>
      </div>
    </CardContent>
  </Card>
</template>
