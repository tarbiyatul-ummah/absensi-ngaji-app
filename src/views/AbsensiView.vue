<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { getSantri, getJilid } from "../services/masterService";
import {
  saveAttendance,
  listenAttendanceByDate,
} from "../services/attendanceService";
import type { Santri, Jilid, Attendance, AttendanceStatus } from "../types";
import type { Unsubscribe } from "firebase/firestore";
// import { useRoute } from "vue-router"; // Dihapus jika tidak digunakan

// Import komponen-komponen kecil
import AbsensiFilter from "../components/absensi/AbsensiFilter.vue";
import AbsensiList from "../components/absensi/AbsensiList.vue";
import DailyRecapButton from "../components/absensi/DailyRecapButton.vue";
import Toast from "../components/master/Toast.vue";

// 🛠️ HELPER: Dapatkan tanggal sesuai Local Timezone Device (Format: YYYY-MM-DD)
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// State Tanggal
const todayDate = computed(() => getLocalDateString());
const currentDate = ref<string>(getLocalDateString());

// State Data & UI
const selectedJilid = ref("Semua");
const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const attendanceData = ref<Attendance[]>([]);
const savingSantriIds = ref<Set<string>>(new Set());
let unsubscribeAttendance: Unsubscribe | null = null;

// State Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const triggerToast = (msg: string, type: "success" | "error" = "success") => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
};

// Handle page visibility: Refresh tanggal saat tab kembali dibuka
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    currentDate.value = getLocalDateString();
  }
};

onMounted(async () => {
  // Pasang listener saat komponen dipasang
  document.addEventListener("visibilitychange", handleVisibilityChange);

  try {
    // Ambil master data secara paralel (lebih cepat)
    const [santriRes, jilidRes] = await Promise.all([getSantri(), getJilid()]);
    santriList.value = santriRes;
    jilidList.value = jilidRes;
  } catch (error) {
    triggerToast("Koneksi bermasalah. Data belum bisa dimuat.", "error");
  }
});

onUnmounted(() => {
  resetAttendanceListener();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

const resetAttendanceListener = () => {
  if (unsubscribeAttendance) {
    unsubscribeAttendance();
    unsubscribeAttendance = null;
  }
};

// Listener Firebase berdasarkan tanggal
const listenCurrentDateAttendance = () => {
  resetAttendanceListener();

  if (currentDate.value > todayDate.value) {
    currentDate.value = todayDate.value;
    triggerToast("Tanggal tidak boleh melebihi hari ini.", "error");
    return;
  }

  unsubscribeAttendance = listenAttendanceByDate(
    currentDate.value,
    (data) => {
      attendanceData.value = data;
    },
    () => {
      triggerToast("Koneksi bermasalah. Absensi gagal dimuat.", "error");
    },
  );
};

// Pantau perubahan currentDate
watch(currentDate, listenCurrentDateAttendance, { immediate: true });

// Formatter Tanggal UI (contoh: Senin, 16 Mei 2026)
const formattedDate = computed(() => {
  const date = new Date(currentDate.value + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Fitur 1: Sorting Alphabet dan Filter Jilid
const filteredSantri = computed(() => {
  let list = santriList.value.filter((s) => s.isActive);
  if (selectedJilid.value !== "Semua") {
    list = list.filter((s) => s.jilidId === selectedJilid.value);
  }
  return list.sort((a, b) => a.nama.localeCompare(b.nama));
});

// Ringkasan Absensi
const attendanceSummary = computed(() => {
  const total = filteredSantri.value.length;
  let present = 0;
  let permission = 0;

  filteredSantri.value.forEach((santri) => {
    const record = attendanceData.value.find((a) => a.santriId === santri.id);
    if (!record) return;
    const status = record.status ?? (record.isPresent ? "present" : "absent");
    if (status === "present") present += 1;
    if (status === "permission") permission += 1;
  });

  return {
    total,
    present,
    permission,
    unmarked: total - present - permission,
  };
});

// Handle Ubah Status Absensi
const handleStatusChange = async (santri: Santri, status: AttendanceStatus) => {
  const previousData = attendanceData.value.map((item) => ({ ...item }));
  let record = attendanceData.value.find((a) => a.santriId === santri.id);

  const currentStatus =
    record?.status ?? (record?.isPresent ? "present" : "absent");
  const nextStatus: AttendanceStatus =
    currentStatus === status ? "absent" : status;
  const isPresent = nextStatus === "present";

  // Optimistic UI Update (Update UI seketika sebelum tunggu server)
  if (record) {
    record.isPresent = isPresent;
    record.status = nextStatus;
  } else {
    attendanceData.value.push({
      id: "",
      date: currentDate.value,
      santriId: santri.id,
      jilidId: santri.jilidId,
      guruId: santri.guruId,
      isPresent,
      status: nextStatus,
    });
  }

  savingSantriIds.value.add(santri.id);

  try {
    await saveAttendance({
      date: currentDate.value,
      santriId: santri.id,
      jilidId: santri.jilidId,
      guruId: santri.guruId,
      isPresent,
      status: nextStatus,
    });
  } catch (error) {
    // Rollback jika gagal API
    attendanceData.value = previousData;
    triggerToast("Koneksi bermasalah. Absensi gagal disimpan.", "error");
  } finally {
    savingSantriIds.value.delete(santri.id);
  }
};
</script>

<template>
  <div class="pb-24 font-sans">
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <div>
        <h1 class="text-[20px] font-bold text-[#202223]">Absensi Harian</h1>
        <p class="text-[14px] text-[#6D7175] mt-1">{{ formattedDate }}</p>
      </div>
      <!-- Cukup gunakan v-model, vue otomatis urus event @change -->
      <input
        type="date"
        v-model="currentDate"
        :max="todayDate"
        autocomplete="off"
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
        class="grid grid-cols-3 gap-2 sm:gap-3"
        aria-label="Ringkasan absensi"
      >
        <div
          class="rounded-lg border border-[#D0E4C9] bg-[#F1F8EF] p-2.5 sm:p-3"
        >
          <p class="text-[12px] text-[#008060]">Hadir</p>
          <p class="text-[20px] font-bold text-[#008060]">
            {{ attendanceSummary.present }}
          </p>
        </div>
        <div
          class="rounded-lg border border-[#F1D28A] bg-[#FFF8E6] p-2.5 sm:p-3"
        >
          <p class="text-[12px] text-[#8A6116]">Izin</p>
          <p class="text-[20px] font-bold text-[#8A6116]">
            {{ attendanceSummary.permission }}
          </p>
        </div>
        <div
          class="rounded-lg border border-[#E1E3E5] bg-[#F9FAFB] p-2.5 sm:p-3"
        >
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
        @status-change="handleStatusChange"
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
