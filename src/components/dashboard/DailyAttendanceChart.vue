<script setup lang="ts">
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
  <section
    class="bg-white rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] overflow-hidden"
  >
    <div class="px-4 py-3 border-b border-[#F1F2F3] bg-[#FAFAFA]">
      <h3 class="text-[14px] font-bold text-[#202223]">
        Grafik Kehadiran Harian
      </h3>
      <p class="mt-0.5 text-[12px] text-[#6D7175]">
        7 tanggal terakhir sesuai hari yang dipilih
      </p>
    </div>

    <div class="p-4">
      <details class="relative mb-4">
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-[#C9CCCF] bg-white px-3 py-2.5 text-[13px] font-medium text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] marker:hidden"
        >
          <span>Hari yang di-track</span>
          <span class="truncate text-right text-[12px] font-semibold text-[#008060]">
            {{ selectedDaySummary() }}
          </span>
        </summary>

        <div
          class="absolute left-0 right-0 z-20 mt-2 grid grid-cols-2 gap-2 rounded-md border border-[#D5D9DD] bg-white p-2 shadow-lg sm:grid-cols-4"
          aria-label="Hari yang di-track pada grafik"
        >
          <label
            v-for="day in trackedDayOptions"
            :key="day.value"
            class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium text-[#202223] transition-colors hover:bg-[#F4F6F8]"
            :class="
              isTrackedDaySelected(day.value)
                ? 'bg-[#E3F1DF] text-[#008060]'
                : 'text-[#454749]'
            "
          >
            <input
              type="checkbox"
              class="h-4 w-4 shrink-0 accent-[#008060]"
              :checked="isTrackedDaySelected(day.value)"
              @click="handleTrackedDayClick($event, day.value)"
            />
            <span>{{ day.label }}</span>
          </label>
        </div>
      </details>

      <div
        class="flex h-56 items-end gap-2 rounded-md border border-[#E1E3E5] bg-[#F9FAFB] px-3 pt-4 pb-3"
      >
        <div
          v-for="item in items"
          :key="item.date"
          class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <div class="text-center">
            <p class="text-[12px] font-bold text-[#202223]">
              {{ item.count }}
            </p>
            <p class="text-[10px] text-[#6D7175]">
              {{ item.percentage }}%
            </p>
          </div>

          <div
            class="flex h-32 w-full max-w-9 items-end rounded bg-[#E3F1DF]"
            :aria-label="`${item.label}: ${item.count} santri hadir`"
          >
            <div
              class="w-full rounded bg-[#008060] transition-all"
              :style="{ height: barHeight(item.count) }"
            ></div>
          </div>

          <p
            class="w-full truncate text-center text-[11px] font-medium text-[#454749]"
            :title="item.label"
          >
            {{ item.shortLabel }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between text-[12px]">
        <span class="text-[#6D7175]">Basis persentase</span>
        <span class="font-semibold text-[#202223]">
          {{ totalSantri }} santri aktif
        </span>
      </div>
    </div>
  </section>
</template>
