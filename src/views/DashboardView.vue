<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import type { Santri, Jilid, Guru, Attendance } from "../types";
import StatisticCard from "../components/dashboard/StatisticCard.vue";
import StatisticListCard from "../components/dashboard/StatisticListCard.vue";
import Toast from "../components/master/Toast.vue";

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const attendanceList = ref<Attendance[]>([]);
const isLoading = ref(true);
const showToast = ref(false);
const toastMessage = ref("");

const triggerToast = (message: string) => {
  toastMessage.value = message;
  showToast.value = true;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

onMounted(async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    const [resSantri, resJilid, resGuru, resAttendance] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
      getAttendanceByDateRange(
        formatDateInput(startDate),
        formatDateInput(endDate),
      ),
    ]);
    santriList.value = resSantri.filter((s) => s.isActive);
    jilidList.value = resJilid;
    guruList.value = resGuru;
    attendanceList.value = resAttendance;
  } catch (error) {
    triggerToast("Koneksi bermasalah. Dashboard belum bisa dimuat.");
  } finally {
    isLoading.value = false;
  }
});

// 1. Total Seluruh Siswa Aktif
const totalSantri = computed(() => santriList.value.length);

// 2. Statistik berdasarkan Jilid
const jilidStats = computed(() => {
  return jilidList.value
    .map((jilid) => ({
      nama: jilid.nama,
      count: santriList.value.filter((s) => s.jilidId === jilid.id).length,
    }))
    .sort((a, b) => b.count - a.count); // Urutkan dari yang terbanyak
});

// 3. Statistik berdasarkan Guru
const guruStats = computed(() => {
  return guruList.value
    .map((guru) => ({
      nama: guru.nama,
      count: santriList.value.filter((s) => s.guruId === guru.id).length,
    }))
    .sort((a, b) => b.count - a.count);
});

const attendanceStats = computed(() => {
  const presentCountBySantri = attendanceList.value.reduce(
    (acc, attendance) => {
      if (attendance.isPresent) {
        acc[attendance.santriId] = (acc[attendance.santriId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return santriList.value.map((santri) => ({
    nama: santri.nama,
    count: presentCountBySantri[santri.id] || 0,
  }));
});

const santriJarangHadir = computed(() => {
  return [...attendanceStats.value]
    .sort((a, b) => a.count - b.count || a.nama.localeCompare(b.nama))
    .slice(0, 5);
});

const santriPalingAktif = computed(() => {
  return [...attendanceStats.value]
    .sort((a, b) => b.count - a.count || a.nama.localeCompare(b.nama))
    .slice(0, 5);
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
        Ringkasan data santri aktif dan kehadiran 30 hari terakhir
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
          <svg
            class="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </template>
      </StatisticCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Seksi Jilid -->
        <StatisticListCard title="Berdasarkan Jilid" :items="jilidStats" />

        <!-- Seksi Guru -->
        <StatisticListCard
          title="Berdasarkan Guru"
          :items="guruStats"
          badge-color="green"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatisticListCard
          title="Santri Jarang Hadir"
          :items="santriJarangHadir"
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
