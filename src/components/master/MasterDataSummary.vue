<script setup lang="ts">
import { terms } from "../../config/organization";

interface SummaryItem {
  nama: string;
  count: number;
}

defineProps<{
  totalActive: number;
  totalInactive: number;
  jilidStats: SummaryItem[];
  guruStats: SummaryItem[];
}>();
</script>

<template>
  <section
    class="bg-white rounded-lg border border-[#E1E3E5] shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div class="grid grid-cols-2 border-b border-[#F1F2F3]">
      <div class="p-4 border-r border-[#F1F2F3]">
        <p class="text-[12px] text-[#6D7175]">
          {{ terms.studentSingularTitle }} Aktif
        </p>
        <p class="text-[24px] font-bold leading-tight text-[#008060]">
          {{ totalActive }}
        </p>
      </div>
      <div class="p-4">
        <p class="text-[12px] text-[#6D7175]">Non Aktif</p>
        <p class="text-[24px] font-bold leading-tight text-[#454749]">
          {{ totalInactive }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-0 md:grid-cols-2">
      <div class="p-4 md:border-r md:border-[#F1F2F3]">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[13px] font-semibold text-[#202223]">
            Per {{ terms.levelSingularTitle }}
          </h2>
          <span class="text-[11px] text-[#6D7175]">
            {{ jilidStats.length }} {{ terms.levelSingularLower }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="item in jilidStats"
            :key="item.nama"
            class="inline-flex items-center gap-1 rounded-md border border-[#D0E4C9] bg-[#F1F8EF] px-2 py-1 text-[12px] text-[#202223]"
          >
            <span class="font-medium">{{ item.nama }}</span>
            <span class="text-[#6D7175]">:</span>
            <span class="font-bold text-[#008060]">{{ item.count }}</span>
          </span>
          <span v-if="jilidStats.length === 0" class="text-[12px] text-[#6D7175]">
            Belum ada data {{ terms.levelSingularLower }}.
          </span>
        </div>
      </div>

      <div class="border-t border-[#F1F2F3] p-4 md:border-t-0">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[13px] font-semibold text-[#202223]">
            Per {{ terms.mentorSingularTitle }}
          </h2>
          <span class="text-[11px] text-[#6D7175]">
            {{ guruStats.length }} {{ terms.mentorSingularLower }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="item in guruStats"
            :key="item.nama"
            class="inline-flex items-center gap-1 rounded-md border border-[#D5D9DD] bg-[#F9FAFB] px-2 py-1 text-[12px] text-[#202223]"
          >
            <span class="font-medium">{{ item.nama }}</span>
            <span class="text-[#6D7175]">:</span>
            <span class="font-bold text-[#454749]">{{ item.count }}</span>
          </span>
          <span v-if="guruStats.length === 0" class="text-[12px] text-[#6D7175]">
            Belum ada data {{ terms.mentorSingularLower }}.
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
