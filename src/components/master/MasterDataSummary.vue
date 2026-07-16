<script setup lang="ts">
import { terms } from "../../config/organization";

interface SummaryItem {
  nama: string;
  aktif: number;
}

defineProps<{
  totalActive: number;
  totalInactive: number;
  jilidStats: SummaryItem[];
  guruStats: SummaryItem[];
  tipeStats: SummaryItem[];
}>();
</script>

<template>
  <section
    class="overflow-hidden rounded-lg border border-[#E1E3E5] bg-white shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)]"
  >
    <div class="grid grid-cols-2 border-b border-[#F1F2F3]">
      <div class="border-r border-[#F1F2F3] px-4 py-3">
        <p class="text-[12px] text-[#6D7175]">
          {{ terms.studentSingularTitle }} Aktif
        </p>
        <p class="text-[22px] font-bold leading-tight text-[#008060]">
          {{ totalActive }}
        </p>
      </div>
      <div class="px-4 py-3">
        <p class="text-[12px] text-[#6D7175]">Non Aktif</p>
        <p class="text-[22px] font-bold leading-tight text-[#454749]">
          {{ totalInactive }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3">
      <div class="p-4 md:border-r md:border-[#F1F2F3]">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-[14px] font-semibold text-[#202223]">
            Per {{ terms.levelSingularTitle }}
          </h2>
          <span class="text-[12px] text-[#6D7175]">
            {{ jilidStats.length }} {{ terms.levelSingularLower }}
          </span>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] leading-6">
          <span
            v-for="item in jilidStats"
            :key="item.nama"
            class="min-w-0 break-words text-[#202223]"
          >
            <span class="font-medium">{{ item.nama }}</span>:
            <span class="font-semibold text-[#008060]">{{ item.aktif }}</span>
          </span>
          <span v-if="jilidStats.length === 0" class="text-[#6D7175]">
            Belum ada data {{ terms.levelSingularLower }}.
          </span>
        </div>
      </div>

      <div class="border-t border-[#F1F2F3] p-4 md:border-t-0 md:border-r">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-[14px] font-semibold text-[#202223]">
            Per {{ terms.mentorSingularTitle }}
          </h2>
          <span class="text-[12px] text-[#6D7175]">
            {{ guruStats.length }} {{ terms.mentorSingularLower }}
          </span>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] leading-6">
          <span
            v-for="item in guruStats"
            :key="item.nama"
            class="min-w-0 break-words text-[#202223]"
          >
            <span class="font-medium">{{ item.nama }}</span>:
            <span class="font-semibold text-[#008060]">{{ item.aktif }}</span>
          </span>
          <span v-if="guruStats.length === 0" class="text-[#6D7175]">
            Belum ada data {{ terms.mentorSingularLower }}.
          </span>
        </div>
      </div>

      <div class="border-t border-[#F1F2F3] p-4 md:border-t-0">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-[14px] font-semibold text-[#202223]">Per Tipe</h2>
          <span class="text-[12px] text-[#6D7175]">
            {{ tipeStats.length }} tipe
          </span>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] leading-6">
          <span
            v-for="item in tipeStats"
            :key="item.nama"
            class="min-w-0 break-words text-[#202223]"
          >
            <span class="font-medium">{{ item.nama }}</span>:
            <span class="font-semibold text-[#008060]">{{ item.aktif }}</span>
          </span>
          <span v-if="tipeStats.length === 0" class="text-[#6D7175]">
            Belum ada data tipe.
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
