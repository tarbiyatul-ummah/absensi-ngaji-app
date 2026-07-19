<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ChevronRight } from "@lucide/vue";
import { getSantri } from "../services/masterService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import {
  getAcademicYears,
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "../services/academicYearService";
import type { AcademicYear, Santri, Attendance } from "../types";
import {
  dashboardMenuItems,
  organizationConfig,
  terms,
} from "../config/organization";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
  getCurrentSemester,
  getPeriodLabel,
} from "../utils/academicPeriod";

const santriList = ref<Santri[]>([]);
const attendanceList = ref<Attendance[]>([]);
const weeklyAttendanceList = ref<Attendance[]>([]);
const academicYearList = ref<AcademicYear[]>([]);
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
const activeDashboardMenuItems = dashboardMenuItems.filter(
  (item) => item.enabled,
);
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
  getAcademicYearSelectOptions(academicYearList.value),
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
    const [resSantri, academicYearRes] = await Promise.all([
      getSantri(),
      getAcademicYears().catch(() => []),
    ]);
    santriList.value = resSantri.filter((s) => s.isActive !== false);
    academicYearList.value = academicYearRes;
    selectedAcademicYearStart.value =
      getDefaultAcademicYearStart(academicYearRes);
    const monthOptions = getAcademicMonthOptions(
      selectedAcademicYearStart.value,
    );
    selectedMonth.value = monthOptions[0]?.value ?? selectedMonth.value;
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
  <div class="app-page">
    <Toast
      :show="showToast"
      :message="toastMessage"
      type="error"
      @close="showToast = false"
    />

    <header class="app-container app-header pb-4">
      <div>
      <h1 class="app-title">Dashboard Rekap</h1>
      <p class="app-subtitle">
        Ringkasan data {{ terms.studentSingularLower }} aktif dan kehadiran per
        periode
      </p>
      </div>
    </header>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      ></div>
    </div>

    <div v-else class="app-container space-y-6">
      <!-- Card: Total Utama -->
      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>
            Menu {{ organizationConfig.typeLabel }}
          </CardTitle>
          <CardDescription>
            Fitur aktif sesuai kebutuhan organisasi
          </CardDescription>
        </CardHeader>

        <div class="space-y-2.5 p-4">
          <RouterLink
            v-for="item in activeDashboardMenuItems"
            :key="item.key"
            :to="item.to"
            class="flex min-h-[76px] items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 transition hover:bg-muted"
          >
            <div class="flex h-7 w-7 shrink-0 items-start justify-center pt-0.5 text-foreground">
              <HugeiconsIcon
                :icon="item.icon"
                :size="18"
                color="currentColor"
                :stroke-width="1.9"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold leading-5 text-foreground">
                {{ item.label }}
              </h3>
              <p class="mt-1 text-xs leading-5 text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
            <ChevronRight
              class="h-4 w-4 shrink-0 text-muted-foreground"
              :stroke-width="1.8"
              aria-hidden="true"
            />
          </RouterLink>
        </div>
      </Card>

      <DailyAttendanceChart
        :items="weeklyAttendanceChart"
        :total-santri="totalSantri"
        :tracked-day-options="trackedDayOptions"
        :selected-tracked-weekdays="selectedTrackedWeekdays"
        @toggle-tracked-weekday="toggleTrackedWeekday"
      />

      <Card class="gap-0 px-4 py-4">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-foreground">
                Periode Ranking
              </h2>
              <p class="mt-1 text-sm leading-5 text-muted-foreground">
                {{ selectedPeriodLabel }} - {{ selectedDateRangeLabel }}
              </p>
            </div>

            <div class="inline-flex h-9 w-fit max-w-full shrink-0 items-center overflow-x-auto rounded-md bg-muted p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="
                  selectedPeriodType === 'academicYear'
                    ? 'h-7 bg-background px-3 text-foreground shadow-xs hover:bg-background'
                    : 'h-7 px-3 text-muted-foreground hover:bg-transparent hover:text-foreground'
                "
                @click="selectedPeriodType = 'academicYear'"
              >
                Tahun Ajaran
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="
                  selectedPeriodType === 'semester'
                    ? 'h-7 bg-background px-3 text-foreground shadow-xs hover:bg-background'
                    : 'h-7 px-3 text-muted-foreground hover:bg-transparent hover:text-foreground'
                "
                @click="selectedPeriodType = 'semester'"
              >
                Semester
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="
                  selectedPeriodType === 'month'
                    ? 'h-7 bg-background px-3 text-foreground shadow-xs hover:bg-background'
                    : 'h-7 px-3 text-muted-foreground hover:bg-transparent hover:text-foreground'
                "
                @click="selectedPeriodType = 'month'"
              >
                Bulanan
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div class="min-w-[150px] sm:w-40">
              <Label class="mb-1.5 text-xs">
                Tahun Ajaran
              </Label>
              <select
                :value="selectedAcademicYearStart"
                @change="
                  handleAcademicYearChange(
                    ($event.target as HTMLSelectElement).value,
                  )
                "
                class="ui-select h-9"
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

            <div
              v-if="selectedPeriodType === 'semester'"
              class="min-w-[130px] sm:w-36"
            >
              <Label class="mb-1.5 text-xs">
                Semester
              </Label>
              <select
                v-model="selectedSemester"
                class="ui-select h-9"
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>

            <div
              v-if="selectedPeriodType === 'month'"
              class="min-w-[160px] sm:w-44"
            >
              <Label class="mb-1.5 text-xs">
                Bulan
              </Label>
              <select
                v-model="selectedMonth"
                class="ui-select h-9"
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
        </div>
      </Card>

      <div
        v-if="isAttendanceLoading"
        class="rounded-xl border bg-card px-4 py-3 text-center text-[13px] text-muted-foreground shadow-sm"
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
          :title="`${terms.studentSingularTitle} Paling Aktif`"
          :items="santriPalingAktif"
          badge-color="green"
          unit="Kali"
        />
      </div>
    </div>
  </div>
</template>
