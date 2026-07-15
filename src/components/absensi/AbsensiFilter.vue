<script setup lang="ts">
import { Button } from "@/components/ui/button";
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
    <Button
      v-for="jilid in [{ id: 'Semua', nama: 'Semua' }, ...jilidList]"
      :key="jilid.id"
      type="button"
      variant="ghost"
      size="sm"
      @click="$emit('update:selectedJilid', jilid.id)"
      :class="[
        'whitespace-nowrap rounded-full px-4 text-[13px]',
        selectedJilid === jilid.id
          ? 'bg-secondary text-foreground'
          : 'bg-transparent text-muted-foreground',
      ]"
    >
      {{ jilid.nama }}
    </Button>
  </div>
</template>
