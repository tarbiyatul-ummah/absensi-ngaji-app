<script setup lang="ts">
import type { Jilid } from "../../types";

defineProps<{
  jilidList: Jilid[];
  selectedJilid: string;
}>();

defineEmits<{
  (e: "update:selectedJilid", id: string): void;
}>();
</script>

<template>
  <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
    <button
      v-for="jilid in [{ id: 'Semua', nama: 'Semua' }, ...jilidList]"
      :key="jilid.id"
      @click="$emit('update:selectedJilid', jilid.id)"
      :class="[
        'whitespace-nowrap px-4 py-1.5 text-[13px] font-medium transition-colors rounded-full',
        selectedJilid === jilid.id
          ? 'bg-[#E4E5E7] text-[#202223]'
          : 'bg-transparent text-[#6D7175] hover:bg-[#F4F6F8]',
      ]"
    >
      {{ jilid.nama }}
    </button>
  </div>
</template>
