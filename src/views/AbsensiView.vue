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
const todayDate = new Date().toISOString().split("T")[0];
const selectedJilid = ref("Semua");
const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const attendanceData = ref<Attendance[]>([]);
const savingSantriIds = ref<Set<string>>(new Set());

onMounted(async () => {
  try {
    santriList.value = await getSantri();
    jilidList.value = await getJilid();
    await loadAttendance();
  } catch (error) {
    triggerToast("Koneksi bermasalah. Data belum bisa dimuat.", "error");
  }
});

const loadAttendance = async () => {
  if (currentDate.value > todayDate) {
    currentDate.value = todayDate;
    triggerToast("Tanggal tidak boleh melebihi hari ini.", "error");
    return;
  }

  try {
    attendanceData.value = await getAttendanceByDate(currentDate.value);
  } catch (error) {
    triggerToast("Koneksi bermasalah. Absensi gagal dimuat.", "error");
  }
};

// State untuk Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const triggerToast = (msg: string, type: "success" | "error" = "success") => {
  toastMessage.value = msg;
  toastType.value = type;
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

const attendanceSummary = computed(() => {
  const total = filteredSantri.value.length;
  let present = 0;

  filteredSantri.value.forEach((santri) => {
    const record = attendanceData.value.find((a) => a.santriId === santri.id);
    if (!record) return;
    if (record.isPresent) present += 1;
  });

  return {
    total,
    present,
    unmarked: total - present,
  };
});

const handleToggle = async (santri: Santri, status: boolean) => {
  const previousData = attendanceData.value.map((item) => ({ ...item }));
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

  savingSantriIds.value = new Set([...savingSantriIds.value, santri.id]);

  try {
    await saveAttendance({
      date: currentDate.value,
      santriId: santri.id,
      jilidId: santri.jilidId,
      guruId: santri.guruId,
      isPresent: status,
    });
  } catch (error) {
    attendanceData.value = previousData;
    triggerToast("Koneksi bermasalah. Absensi gagal disimpan.", "error");
  } finally {
    const nextSavingIds = new Set(savingSantriIds.value);
    nextSavingIds.delete(santri.id);
    savingSantriIds.value = nextSavingIds;
  }
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
        :max="todayDate"
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
          @error="(msg) => triggerToast(msg, 'error')"
        />
      </div>

      <div
        class="grid grid-cols-2 gap-2 sm:gap-3"
        aria-label="Ringkasan absensi"
      >
        <div class="rounded-lg border border-[#D0E4C9] bg-[#F1F8EF] p-2.5 sm:p-3">
          <p class="text-[12px] text-[#008060]">Hadir</p>
          <p class="text-[20px] font-bold text-[#008060]">
            {{ attendanceSummary.present }}
          </p>
        </div>
        <div class="rounded-lg border border-[#E1E3E5] bg-[#F9FAFB] p-2.5 sm:p-3">
          <p class="text-[12px] text-[#6D7175]">Belum diabsen</p>
          <p class="text-[20px] font-bold text-[#454749]">
            {{ attendanceSummary.unmarked }}
          </p>
        </div>
      </div>

      <AbsensiList
        :filteredSantri="filteredSantri"
        :jilidList="jilidList"
        :attendanceData="attendanceData"
        :savingSantriIds="savingSantriIds"
        @toggle="handleToggle"
      />
    </div>

    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
  </div>
</template>
