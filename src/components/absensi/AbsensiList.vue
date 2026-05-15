<script setup lang="ts">
import type {
  Santri,
  Jilid,
  Attendance,
  AttendanceStatus,
} from "../../types";

const props = defineProps<{
  filteredSantri: Santri[];
  jilidList: Jilid[];
  attendanceData: Attendance[];
  savingSantriIds?: Set<string>;
}>();

const emit = defineEmits<{
  (e: "status-change", santri: Santri, status: AttendanceStatus): void;
}>();

const getAttendanceStatus = (santriId: string): AttendanceStatus => {
  const record = props.attendanceData.find((a) => a.santriId === santriId);
  if (!record) return "absent";
  if (record.status) return record.status;
  return record.isPresent ? "present" : "absent";
};

const isSaving = (santriId: string) => {
  return props.savingSantriIds?.has(santriId) ?? false;
};

const getButtonClass = (santriId: string, status: AttendanceStatus) => {
  const activeStatus = getAttendanceStatus(santriId);
  const isActive = activeStatus === status;

  if (status === "present") {
    return isActive
      ? "border-[#008060] bg-[#E3F1DF] text-[#008060]"
      : "border-[#C9CCCF] bg-white text-[#454749] hover:bg-[#F9FAFB]";
  }

  return isActive
    ? "border-[#B98900] bg-[#FFF4D6] text-[#8A6116]"
    : "border-[#C9CCCF] bg-white text-[#454749] hover:bg-[#F9FAFB]";
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div
      class="p-4 border-b border-[#E1E3E5] flex justify-between items-center bg-[#FAFAFA]"
    >
      <h2 class="text-[14px] font-semibold text-[#202223]">Daftar Kehadiran</h2>
      <span class="text-[12px] text-[#6D7175] font-medium"
        >{{ filteredSantri.length }} Santri</span
      >
    </div>

    <div class="divide-y divide-[#E1E3E5]">
      <div
        v-for="santri in filteredSantri"
        :key="santri.id"
        class="flex flex-col gap-3 p-4 hover:bg-[#F9FAFB] transition-colors sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex flex-col">
          <span class="text-[14px] font-medium text-[#202223]">{{
            santri.nama
          }}</span>
          <!-- Keterangan Jilid kecil di bawah nama -->
          <span class="text-[12px] text-[#6D7175]">
            {{ jilidList.find((j) => j.id === santri.jilidId)?.nama || "N/A" }}
          </span>
        </div>

        <div
          class="grid grid-cols-2 gap-2 sm:w-[176px]"
          :class="isSaving(santri.id) ? 'cursor-wait opacity-70' : ''"
          role="group"
          :aria-label="`Status absensi ${santri.nama}`"
        >
          <button
            type="button"
            class="h-9 rounded-md border px-3 text-[13px] font-semibold transition-colors disabled:cursor-wait"
            :class="getButtonClass(santri.id, 'present')"
            :disabled="isSaving(santri.id)"
            :aria-pressed="getAttendanceStatus(santri.id) === 'present'"
            @click="emit('status-change', santri, 'present')"
          >
            Hadir
          </button>
          <button
            type="button"
            class="h-9 rounded-md border px-3 text-[13px] font-semibold transition-colors disabled:cursor-wait"
            :class="getButtonClass(santri.id, 'permission')"
            :disabled="isSaving(santri.id)"
            :aria-pressed="getAttendanceStatus(santri.id) === 'permission'"
            @click="emit('status-change', santri, 'permission')"
          >
            Izin
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredSantri.length === 0"
        class="p-8 text-center text-[#6D7175] text-[14px]"
      >
        Tidak ada data santri untuk filter ini.
      </div>
    </div>
  </div>
</template>
