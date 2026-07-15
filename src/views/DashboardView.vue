<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { getSantri } from "../services/masterService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import type { Santri, Attendance } from "../types";
import StatisticCard from "../components/dashboard/StatisticCard.vue";
import StatisticListCard from "../components/dashboard/StatisticListCard.vue";
import DailyAttendanceChart from "../components/dashboard/DailyAttendanceChart.vue";
import Toast from "../components/master/Toast.vue";
import {
  type AcademicPeriodType,
  type AcademicSemester,
  formatDateInput,
  formatDateLong,
  getAcademicMonthOptions,
  getAcademicPeriodRange,
  getAcademicYearOptions,
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
  getCurrentSemester,
  getPeriodLabel,
} from "../utils/academicPeriod";

const santriList = ref<Santri[]>([]);
const attendanceList = ref<Attendance[]>([]);
const weeklyAttendanceList = ref<Attendance[]>([]);
const isLoading = ref(true);
const isAttendanceLoading = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const selectedPeriodType = ref<AcademicPeriodType>("semester");
const selectedAcademicYearStart = ref(getCurrentAcademicYearStart());
const selectedSemester = ref<AcademicSemester>(getCurrentSemester());
const selectedMonth = ref(getCurrentAcademicMonth());
const trackedDayOptions = [
  { value: 1, label: "Senin", shortLabel: "Sen" },
  { value: 2, label: "Selasa", shortLabel: "Sel" },
  { value: 3, label: "Rabu", shortLabel: "Rab" },
  { value: 4, label: "Kamis", shortLabel: "Kam" },
  { value: 5, label: "Jumat", shortLabel: "Jum" },
  { value: 6, label: "Sabtu", shortLabel: "Sab" },
  { value: 0, label: "Minggu", shortLabel: "Min" },
];
const selectedTrackedWeekdays = ref([1, 2, 3, 4, 5]);

const triggerToast = (message: string) => {
  toastMessage.value = message;
  showToast.value = true;
};

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

const selectedTrackedWeekdaySet = computed(
  () => new Set(selectedTrackedWeekdays.value),
);

const getLastTrackedDates = (totalDays: number) => {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const trackedWeekdays =
    selectedTrackedWeekdays.value.length > 0
      ? selectedTrackedWeekdaySet.value
      : new Set([1, 2, 3, 4, 5]);

  while (dates.length < totalDays) {
    if (trackedWeekdays.has(cursor.getDay())) {
      dates.unshift(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return dates;
};

const isAttendancePresent = (attendance: Attendance) => {
  const status =
    attendance.status ?? (attendance.isPresent ? "present" : "absent");
  return status === "present";
};

const academicYearOptions = computed(() =>
  getAcademicYearOptions(getCurrentAcademicYearStart()),
);

const academicMonthOptions = computed(() =>
  getAcademicMonthOptions(selectedAcademicYearStart.value),
);

const selectedDateRange = computed(() => {
  if (selectedPeriodType.value === "custom") {
    return getAcademicPeriodRange(
      "semester",
      selectedAcademicYearStart.value,
      selectedSemester.value,
      selectedMonth.value,
    );
  }

  return getAcademicPeriodRange(
    selectedPeriodType.value,
    selectedAcademicYearStart.value,
    selectedSemester.value,
    selectedMonth.value,
  );
});

const selectedPeriodLabel = computed(() =>
  getPeriodLabel(
    selectedPeriodType.value,
    selectedAcademicYearStart.value,
    selectedSemester.value,
    selectedMonth.value,
    selectedDateRange.value.start,
    selectedDateRange.value.end,
  ),
);

const selectedDateRangeLabel = computed(
  () =>
    `${formatDateLong(selectedDateRange.value.start)} - ${formatDateLong(
      selectedDateRange.value.end,
    )}`,
);

const loadPeriodAttendance = async () => {
  isAttendanceLoading.value = true;

  try {
    attendanceList.value = await getAttendanceByDateRange(
      selectedDateRange.value.start,
      selectedDateRange.value.end,
    );
  } catch (error) {
    triggerToast("Koneksi bermasalah. Data kehadiran belum bisa dimuat.");
  } finally {
    isAttendanceLoading.value = false;
  }
};

const loadWeeklyAttendance = async () => {
  const endDate = new Date();
  const trackedDates = getLastTrackedDates(7);
  const startDate = trackedDates[0] ?? endDate;

  weeklyAttendanceList.value = await getAttendanceByDateRange(
    formatDateInput(startDate),
    formatDateInput(endDate),
  );
};

const handleAcademicYearChange = (value: string) => {
  selectedAcademicYearStart.value = Number(value);
  const monthOptions = getAcademicMonthOptions(selectedAcademicYearStart.value);
  selectedMonth.value = monthOptions[0]?.value ?? selectedMonth.value;
};

const toggleTrackedWeekday = (day: number) => {
  const currentDays = selectedTrackedWeekdays.value;

  if (currentDays.includes(day)) {
    if (currentDays.length === 1) {
      triggerToast("Minimal pilih 1 hari untuk grafik.");
      return;
    }

    selectedTrackedWeekdays.value = currentDays.filter(
      (trackedDay) => trackedDay !== day,
    );
    return;
  }

  selectedTrackedWeekdays.value = [...currentDays, day].sort((a, b) => {
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });
};

onMounted(async () => {
  try {
    const resSantri = await getSantri();
    santriList.value = resSantri.filter((s) => s.isActive !== false);
    await Promise.all([loadWeeklyAttendance(), loadPeriodAttendance()]);
  } catch (error) {
    triggerToast("Koneksi bermasalah. Dashboard belum bisa dimuat.");
  } finally {
    isLoading.value = false;
  }
});

watch(
  [
    selectedPeriodType,
    selectedAcademicYearStart,
    selectedSemester,
    selectedMonth,
  ],
  () => {
    if (!isLoading.value) loadPeriodAttendance();
  },
);

watch(selectedTrackedWeekdays, () => {
  if (!isLoading.value) {
    loadWeeklyAttendance().catch(() => {
      triggerToast("Koneksi bermasalah. Grafik belum bisa dimuat.");
    });
  }
});

// 1. Total Seluruh Siswa Aktif
const totalSantri = computed(() => santriList.value.length);

const activeSantriIds = computed(
  () => new Set(santriList.value.map((santri) => santri.id)),
);

const getSantriStartDate = (santri: Santri) => {
  if (!santri.createdAt) return selectedDateRange.value.start;

  const createdAtDate = new Date(santri.createdAt);
  if (Number.isNaN(createdAtDate.getTime())) return selectedDateRange.value.start;

  const createdAtDateKey = formatDateInput(createdAtDate);
  return createdAtDateKey > selectedDateRange.value.start
    ? createdAtDateKey
    : selectedDateRange.value.start;
};

const periodAttendanceDates = computed(() => [
  ...new Set(attendanceList.value.map((attendance) => attendance.date)),
]);

const attendanceStats = computed(() => {
  const presentDatesBySantri = attendanceList.value.reduce(
    (acc, attendance) => {
      if (
        activeSantriIds.value.has(attendance.santriId) &&
        isAttendancePresent(attendance)
      ) {
        if (!acc[attendance.santriId]) acc[attendance.santriId] = new Set();
        acc[attendance.santriId].add(attendance.date);
      }
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  return santriList.value.map((santri) => {
    const santriStartDate = getSantriStartDate(santri);
    const eligibleAttendanceDates = periodAttendanceDates.value.filter(
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
});

const santriTidakMasukTerbanyak = computed(() => {
  return [...attendanceStats.value]
    .sort(
      (a, b) =>
        b.missedCount - a.missedCount ||
        a.presentCount - b.presentCount ||
        a.nama.localeCompare(b.nama),
    )
    .map((item) => ({ nama: item.nama, count: item.missedCount }))
    .slice(0, 5);
});

const santriPalingAktif = computed(() => {
  return [...attendanceStats.value]
    .sort(
      (a, b) =>
        b.presentCount - a.presentCount ||
        a.missedCount - b.missedCount ||
        a.nama.localeCompare(b.nama),
    )
    .map((item) => ({ nama: item.nama, count: item.presentCount }))
    .slice(0, 5);
});

const weeklyAttendanceChart = computed(() => {
  return getLastTrackedDates(7).map((date) => {
    const dateKey = formatDateInput(date);
    const count = weeklyAttendanceList.value.filter(
      (attendance) =>
        attendance.date === dateKey &&
        activeSantriIds.value.has(attendance.santriId) &&
        isAttendancePresent(attendance),
    ).length;
    const percentage =
      totalSantri.value > 0 ? Math.round((count / totalSantri.value) * 100) : 0;

    return {
      date: dateKey,
      label: formatLongDate(date),
      shortLabel: formatShortDate(date),
      count,
      percentage,
    };
  });
});
</script>

<template>
  <div class="pb-24 font-sans bg-[#F6F6F7] min-h-screen">
    <Toast
      :show="showToast"
      :message="toastMessage"
      type="error"
      @close="showToast = false"
    />

    <header class="px-4 pt-6 pb-4 max-w-3xl mx-auto">
      <h1 class="text-[20px] font-bold text-[#202223]">Dashboard Rekap</h1>
      <p class="text-[14px] text-[#6D7175]">
        Ringkasan data santri aktif dan kehadiran per periode
      </p>
    </header>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008060]"
      ></div>
    </div>

    <div v-else class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Card: Total Utama -->
      <StatisticCard
        title="Total Seluruh Santri"
        :value="totalSantri"
        icon-bg-color="#E3F1DF"
        icon-color="#008060"
      >
        <template #icon>
          <HugeiconsIcon
            :icon="UserMultipleIcon"
            :size="32"
            color="currentColor"
            :stroke-width="1.7"
          />
        </template>
      </StatisticCard>

      <DailyAttendanceChart
        :items="weeklyAttendanceChart"
        :total-santri="totalSantri"
        :tracked-day-options="trackedDayOptions"
        :selected-tracked-weekdays="selectedTrackedWeekdays"
        @toggle-tracked-weekday="toggleTrackedWeekday"
      />

      <section
        class="bg-white rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-[#F1F2F3] bg-[#FAFAFA]">
          <h3 class="text-[14px] font-bold text-[#202223]">
            Filter Periode Ranking
          </h3>
          <p class="mt-0.5 text-[12px] text-[#6D7175]">
            {{ selectedPeriodLabel }} - {{ selectedDateRangeLabel }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <div>
            <label class="block text-[13px] text-[#202223] font-medium mb-1.5">
              Tahun Ajaran
            </label>
            <select
              :value="selectedAcademicYearStart"
              @change="
                handleAcademicYearChange(
                  ($event.target as HTMLSelectElement).value,
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option
                v-for="year in academicYearOptions"
                :key="year.startYear"
                :value="year.startYear"
              >
                {{ year.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] text-[#202223] font-medium mb-1.5">
              Jenis Periode
            </label>
            <select
              v-model="selectedPeriodType"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option value="semester">Semester</option>
              <option value="month">Bulanan</option>
              <option value="academicYear">Tahun Ajaran</option>
            </select>
          </div>

          <div v-if="selectedPeriodType === 'semester'">
            <label class="block text-[13px] text-[#202223] font-medium mb-1.5">
              Semester
            </label>
            <select
              v-model="selectedSemester"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>

          <div v-if="selectedPeriodType === 'month'">
            <label class="block text-[13px] text-[#202223] font-medium mb-1.5">
              Bulan
            </label>
            <select
              v-model="selectedMonth"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option
                v-for="month in academicMonthOptions"
                :key="month.value"
                :value="month.value"
              >
                {{ month.label }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <div
        v-if="isAttendanceLoading"
        class="rounded-md border border-[#E1E3E5] bg-white px-4 py-3 text-center text-[13px] text-[#6D7175]"
      >
        Memuat data ranking periode...
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatisticListCard
          title="Tidak Masuk Terbanyak"
          :items="santriTidakMasukTerbanyak"
          badge-color="red"
          unit="Kali"
        />

        <StatisticListCard
          title="Santri Paling Aktif"
          :items="santriPalingAktif"
          badge-color="green"
          unit="Kali"
        />
      </div>
    </div>
  </div>
</template>
