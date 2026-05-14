<script setup lang="ts">
interface StatItem {
  nama: string;
  count: number;
}

defineProps<{
  title: string;
  items: StatItem[];
  badgeColor?: string; // e.g., 'blue' atau 'green'
  unit?: string;
}>();
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] overflow-hidden"
  >
    <div class="px-4 py-3 border-b border-[#F1F2F3] bg-[#FAFAFA]">
      <h3 class="text-[14px] font-bold text-[#202223]">{{ title }}</h3>
    </div>
    <div class="divide-y divide-[#F1F2F3]">
      <div
        v-for="stat in items"
        :key="stat.nama"
        class="px-4 py-3 flex justify-between items-center hover:bg-[#F9FAFB]"
      >
        <span class="text-[14px] text-[#454749]">{{ stat.nama }}</span>
        <span
          class="text-[14px] font-bold px-2.5 py-0.5 rounded-full border"
          :class="{
            'bg-[#F4F6F8] text-[#202223] border-[#E1E3E5]':
              badgeColor !== 'green' && badgeColor !== 'red',
            'bg-[#E3F1DF] text-[#008060] border-[#D0E4C9]':
              badgeColor === 'green',
            'bg-[#FFF4F4] text-[#D72C0D] border-[#FED3D1]':
              badgeColor === 'red',
          }"
        >
          {{ stat.count }}
          <span
            class="text-[12px] font-normal"
            :class="{
              'text-[#6D7175]': badgeColor !== 'green' && badgeColor !== 'red',
              'text-[#008060]': badgeColor === 'green',
              'text-[#D72C0D]': badgeColor === 'red',
            }"
            >{{ unit || "Anak" }}</span
          >
        </span>
      </div>
      <div
        v-if="items.length === 0"
        class="px-4 py-6 text-center text-[#6D7175] text-[14px]"
      >
        Tidak ada data
      </div>
    </div>
  </div>
</template>
