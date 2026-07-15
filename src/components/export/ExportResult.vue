<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import { Download05Icon, PrinterIcon } from "@hugeicons/core-free-icons";

defineProps<{
  report: {
    title: string;
    periodLabel: string;
    filterLabel: string;
    generatedAt: string;
    rows: {
      no: number;
      nama: string;
      jilid: string;
      guru: string;
      hadir: number;
      izin: number;
      alfa: number;
    }[];
    totalKehadiran: number;
    totalIzin: number;
    totalAlfa: number;
  } | null;
}>();

const emit = defineEmits<{
  (e: "exportPdf"): void;
  (e: "exportCsv"): void;
}>();
</script>

<template>
  <div
    v-if="report"
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
  >
    <div
      class="p-4 border-b border-[#E1E3E5] flex justify-between items-center bg-[#FAFAFA]"
    >
      <div>
        <h2 class="text-[14px] font-semibold text-[#202223]">
          Preview Laporan
        </h2>
        <p class="mt-0.5 text-[12px] text-[#6D7175]">
          {{ report.periodLabel }} - {{ report.filterLabel }}
        </p>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <div
        class="grid grid-cols-2 gap-3 md:grid-cols-4"
        aria-label="Ringkasan laporan"
      >
        <div class="rounded-md border border-[#D0E4C9] bg-[#F1F8EF] p-3">
          <p class="text-[12px] text-[#008060]">Total Santri</p>
          <p class="text-[20px] font-bold text-[#008060]">
            {{ report.rows.length }}
          </p>
        </div>
        <div class="rounded-md border border-[#D5D9DD] bg-[#F9FAFB] p-3">
          <p class="text-[12px] text-[#454749]">Total Kehadiran</p>
          <p class="text-[20px] font-bold text-[#202223]">
            {{ report.totalKehadiran }}
          </p>
        </div>
        <div class="rounded-md border border-[#F6D6A7] bg-[#FFF8F0] p-3">
          <p class="text-[12px] text-[#916A00]">Total Izin</p>
          <p class="text-[20px] font-bold text-[#916A00]">
            {{ report.totalIzin }}
          </p>
        </div>
        <div class="rounded-md border border-[#FED3D1] bg-[#FFF4F4] p-3">
          <p class="text-[12px] text-[#D72C0D]">Total Alfa</p>
          <p class="text-[20px] font-bold text-[#D72C0D]">
            {{ report.totalAlfa }}
          </p>
        </div>
      </div>

      <div
        class="max-h-80 overflow-auto rounded-md border border-[#C9CCCF] bg-white"
      >
        <table class="min-w-full text-left text-[13px]">
          <thead class="sticky top-0 bg-[#F4F6F8] text-[#454749]">
            <tr>
              <th class="w-12 px-3 py-2 font-semibold">No</th>
              <th class="px-3 py-2 font-semibold">Nama</th>
              <th class="px-3 py-2 font-semibold">Jilid</th>
              <th class="px-3 py-2 font-semibold">Guru</th>
              <th class="w-16 px-3 py-2 text-right font-semibold">Hadir</th>
              <th class="w-16 px-3 py-2 text-right font-semibold">Izin</th>
              <th class="w-16 px-3 py-2 text-right font-semibold">Alfa</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in report.rows"
              :key="row.no"
              class="border-t border-[#E1E3E5]"
            >
              <td class="px-3 py-2 text-[#6D7175]">{{ row.no }}</td>
              <td class="px-3 py-2 font-medium text-[#202223]">
                {{ row.nama }}
              </td>
              <td class="px-3 py-2 text-[#454749]">{{ row.jilid }}</td>
              <td class="px-3 py-2 text-[#454749]">{{ row.guru }}</td>
              <td class="px-3 py-2 text-right font-semibold text-[#202223]">
                {{ row.hadir }}
              </td>
              <td class="px-3 py-2 text-right font-semibold text-[#916A00]">
                {{ row.izin }}
              </td>
              <td class="px-3 py-2 text-right font-semibold text-[#D72C0D]">
                {{ row.alfa }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          @click="emit('exportPdf')"
          class="w-full rounded-md bg-[#008060] px-4 py-3 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] transition-colors flex items-center justify-center gap-2"
        >
          <HugeiconsIcon
            :icon="PrinterIcon"
            :size="20"
            color="currentColor"
            :stroke-width="2"
          />
          Cetak / Simpan PDF
        </button>

        <button
          @click="emit('exportCsv')"
          class="w-full rounded-md border border-[#C9CCCF] bg-white px-4 py-3 text-[14px] font-medium text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#F4F6F8] transition-colors flex items-center justify-center gap-2"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="20"
            color="currentColor"
            :stroke-width="2"
          />
          Export CSV
        </button>
      </div>
    </div>
  </div>
</template>
