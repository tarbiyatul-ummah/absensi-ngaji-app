<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getSantri, getJilid } from "../services/masterService";
import {
  saveAttendance,
  getAttendanceByDate,
} from "../services/attendanceService";
import type { Santri, Jilid, Attendance } from "../types";

// Import komponen-komponen kecil
import AbsensiFilter from "../components/absensi/AbsensiFilter.vue";
import AbsensiList from "../components/absensi/AbsensiList.vue";
import DailyRecapButton from "../components/absensi/DailyRecapButton.vue";
import Toast from "../components/master/Toast.vue"; // Import Toast

const currentDate = ref(new Date().toISOString().split("T")[0]);
const selectedJilid = ref("Semua");
const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const attendanceData = ref<Attendance[]>([]);

onMounted(async () => {
  santriList.value = await getSantri();
  jilidList.value = await getJilid();
  await loadAttendance();
});

const loadAttendance = async () => {
  attendanceData.value = await getAttendanceByDate(currentDate.value);
};

// State untuk Toast
const showToast = ref(false);
const toastMessage = ref("");

const triggerToast = (msg: string) => {
  toastMessage.value = msg;
  showToast.value = true;
};

// Logika Filter dan Sorting (Fitur 1: By Alphabet)
const filteredSantri = computed(() => {
  let list = santriList.value.filter((s) => s.isActive);
  if (selectedJilid.value !== "Semua") {
    list = list.filter((s) => s.jilidId === selectedJilid.value);
  }
  // Sorting Alphabetis A-Z
  return list.sort((a, b) => a.nama.localeCompare(b.nama));
});

const handleToggle = async (santri: Santri, status: boolean) => {
  let record = attendanceData.value.find((a) => a.santriId === santri.id);
  if (record) record.isPresent = status;
  else {
    attendanceData.value.push({
      id: "",
      date: currentDate.value,
      santriId: santri.id,
      jilidId: santri.jilidId,
      guruId: santri.guruId,
      isPresent: status,
    });
  }

  await saveAttendance({
    date: currentDate.value,
    santriId: santri.id,
    jilidId: santri.jilidId,
    guruId: santri.guruId,
    isPresent: status,
  });
};
</script>

<template>
  <div class="pb-24 font-sans">
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <h1 class="text-[20px] font-bold text-[#202223]">Absensi Harian</h1>
      <input
        type="date"
        v-model="currentDate"
        @change="loadAttendance"
        class="rounded-md border border-[#C9CCCF] bg-white px-3 py-1.5 text-[14px] font-medium text-[#202223] outline-none cursor-pointer"
      />
    </header>

    <div class="px-4 space-y-5 max-w-3xl mx-auto">
      <div class="space-y-3">
        <AbsensiFilter
          :jilidList="jilidList"
          v-model:selectedJilid="selectedJilid"
        />

        <!-- Komponen Tombol Rekap Harian (Fitur 2) -->
        <DailyRecapButton
          :filteredSantri="filteredSantri"
          :attendanceData="attendanceData"
          @success="triggerToast"
          @error="(msg) => triggerToast(msg)"
        />
      </div>

      <AbsensiList
        :filteredSantri="filteredSantri"
        :jilidList="jilidList"
        :attendanceData="attendanceData"
        @toggle="handleToggle"
      />
    </div>

    <Toast
      :show="showToast"
      :message="toastMessage"
      @close="showToast = false"
    />
  </div>
</template>
