<script setup lang="ts">
defineProps<{
  title: string;
  value: number;
  subtitle?: string;
  iconBgColor?: string; // e.g., '#E3F1DF'
  iconColor?: string; // e.g., '#008060'
}>();
</script>

<template>
  <div
    class="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] flex items-center justify-between"
  >
    <div>
      <p
        class="text-[14px] font-medium text-[#6D7175] uppercase tracking-wider"
      >
        {{ title }}
      </p>
      <h2 class="text-[36px] font-bold text-[#202223] leading-tight">
        {{ value }}
      </h2>
      <p v-if="subtitle" class="text-[12px] text-[#6D7175] mt-1">
        {{ subtitle }}
      </p>
    </div>
    <div
      v-if="$slots.icon"
      class="p-3 rounded-full"
      :style="{
        backgroundColor: iconBgColor || '#E3F1DF',
      }"
    >
      <div :style="{ color: iconColor || '#008060' }">
        <slot name="icon"></slot>
      </div>
    </div>
  </div>
</template>
