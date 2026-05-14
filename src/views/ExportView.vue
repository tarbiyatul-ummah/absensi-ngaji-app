<script setup lang="ts">
import { ref, onMounted } from "vue";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import type { Santri, Jilid, Guru } from "../types";
import ExportFilter from "../components/export/ExportFilter.vue";
import ExportResult from "../components/export/ExportResult.vue";
import Toast from "../components/master/Toast.vue";

const startDate = ref("");
const endDate = ref("");
const periodType = ref("month"); // 'month', '3months', 'semester', 'custom'
const filterType = ref("semua"); // 'semua', 'jilid', 'guru'
const filterId = ref("");
const resultText = ref("");

// Toast state
const showToast = ref(false);
const toastMessage = ref("");

const triggerToast = (message: string) => {
  toastMessage.value = message;
  showToast.value = true;
};

const isGenerating = ref(false);

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);

const calculateDateRange = (type: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDateCalc = new Date(today);

  const startDateCalc = new Date(today);

  if (type === "month") {
    startDateCalc.setDate(1);
  } else if (type === "3months") {
    startDateCalc.setMonth(today.getMonth() - 2);
    startDateCalc.setDate(1);
  } else if (type === "semester") {
    startDateCalc.setMonth(today.getMonth() - 5);
    startDateCalc.setDate(1);
  }

  return {
    start: startDateCalc.toISOString().split("T")[0],
    end: endDateCalc.toISOString().split("T")[0],
  };
};

onMounted(async () => {
  // Set default periode ke bulan ini
  const range = calculateDateRange("month");
  startDate.value = range.start;
  endDate.value = range.end;

  santriList.value = await getSantri();
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
});

const handlePeriodTypeChange = (type: string) => {
  periodType.value = type;
  if (type !== "custom") {
    const range = calculateDateRange(type);
    startDate.value = range.start;
    endDate.value = range.end;
  }
};

const generateExport = async () => {
  if (!startDate.value || !endDate.value)
    return triggerToast("Pilih periode terlebih dahulu.");
  if (filterType.value !== "semua" && !filterId.value)
    return triggerToast("Pilih spesifik Jilid/Guru terlebih dahulu.");

  isGenerating.value = true;

  try {
    // 1. Ambil semua absensi yang HADIR di periode tersebut
    const q = query(
      collection(db, "attendances"),
      where("date", ">=", startDate.value),
      where("date", "<=", endDate.value),
      where("isPresent", "==", true),
    );
    const attendanceSnapshot = await getDocs(q);

    // Hitung kemunculan tiap santriId (Total Kehadiran)
    const attendanceCount: Record<string, number> = {};
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceCount[data.santriId] =
        (attendanceCount[data.santriId] || 0) + 1;
    });

    // 2. Filter Santri Aktif sesuai pilihan (Semua / Jilid / Guru)
    let filteredSantri = santriList.value.filter((s) => s.isActive);
    if (filterType.value === "jilid") {
      filteredSantri = filteredSantri.filter(
        (s) => s.jilidId === filterId.value,
      );
    } else if (filterType.value === "guru") {
      filteredSantri = filteredSantri.filter(
        (s) => s.guruId === filterId.value,
      );
    }

    if (filteredSantri.length === 0) {
      resultText.value = "Tidak ada data santri untuk filter tersebut.";
      isGenerating.value = false;
      return;
    }

    // 3. Susun Teks WhatsApp dengan periode info
    const startDateObj = new Date(startDate.value + "T00:00:00");
    const endDateObj = new Date(endDate.value + "T00:00:00");

    const startFormatted = startDateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const endFormatted = endDateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let periodLabel = `${startFormatted} - ${endFormatted}`;

    // Check if it's a standard period
    if (periodType.value === "month") {
      const monthName = startDateObj.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      periodLabel = `bulan ${monthName}`;
    } else if (periodType.value === "semester") {
      periodLabel = `6 bulan terakhir`;
    } else if (periodType.value === "3months") {
      periodLabel = `3 bulan terakhir`;
    }

    let text = `Assalamualaikum bapak/ibu, berikut adalah rekap kehadiran ${periodLabel} Ananda di LPQ Tarbiyatul Ummah:\n\n`;

    filteredSantri.forEach((santri, index) => {
      const total = attendanceCount[santri.id] || 0;
      text += `${index + 1}. ${santri.nama}: ${total}\n`;
    });

    text += `\nDimohon untuk Ananda yang kehadirannya masih di Bawah 20 setiap bulan, untuk ditingkatkan semangatnya untuk masuk.`;

    resultText.value = text;
  } catch (error) {
    console.error(error);
    triggerToast("Terjadi kesalahan saat menarik data.");
  } finally {
    isGenerating.value = false;
  }
};

const copyText = () => {
  if (!resultText.value) return;
  navigator.clipboard.writeText(resultText.value);
  triggerToast(
    "Teks berhasil disalin ke Clipboard! Silakan Paste di WhatsApp.",
  );
};
</script>

<template>
  <div class="pb-24 font-sans">
    <!-- Header Shopify Style -->
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <h1 class="text-[20px] font-bold text-[#202223]">Export Rekap WA</h1>
    </header>

    <!-- Toast Component -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      @close="showToast = false"
    />

    <div class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Filter Component -->
      <ExportFilter
        :start-date="startDate"
        :end-date="endDate"
        :period-type="periodType"
        :filter-type="filterType"
        :filter-id="filterId"
        :jilid-list="jilidList"
        :guru-list="guruList"
        :is-generating="isGenerating"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
        @update:period-type="handlePeriodTypeChange"
        @update:filter-type="filterType = $event"
        @update:filter-id="filterId = $event"
        @generate="generateExport"
      />

      <!-- Result Component -->
      <ExportResult :result-text="resultText" @copy="copyText" />
    </div>
  </div>
</template>
