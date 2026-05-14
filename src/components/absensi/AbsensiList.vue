<script setup lang="ts">
import type { Santri, Jilid, Attendance } from "../../types";

const props = defineProps<{
  filteredSantri: Santri[];
  jilidList: Jilid[];
  attendanceData: Attendance[];
  savingSantriIds?: Set<string>;
}>();

const emit = defineEmits<{
  (e: "toggle", santri: Santri, status: boolean): void;
}>();

// Fungsi untuk mengecek status kehadiran berdasarkan attendanceData dari Parent
const isPresent = (santriId: string) => {
  const record = props.attendanceData.find((a) => a.santriId === santriId);
  return record ? record.isPresent : false;
};

const isSaving = (santriId: string) => {
  return props.savingSantriIds?.has(santriId) ?? false;
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
        class="flex items-center justify-between p-4 hover:bg-[#F9FAFB] transition-colors"
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

        <!-- Toggle Switch ala Polaris -->
        <label
          class="relative inline-flex items-center"
          :class="isSaving(santri.id) ? 'cursor-wait opacity-70' : 'cursor-pointer'"
        >
          <input
            type="checkbox"
            class="sr-only peer"
            :checked="isPresent(santri.id)"
            :disabled="isSaving(santri.id)"
            @change="
              emit(
                'toggle',
                santri,
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <div
            class="w-11 h-6 bg-[#C9CCCF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C9CCCF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008060] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
          ></div>
        </label>
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
