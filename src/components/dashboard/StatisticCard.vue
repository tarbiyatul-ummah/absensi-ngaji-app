<script setup lang="ts">
import { Card } from "@/components/ui/card";

defineProps<{
  title: string;
  value: number;
  subtitle?: string;
  iconBgColor?: string; // e.g., '#E3F1DF'
  iconColor?: string; // e.g., '#008060'
}>();
</script>

<template>
  <Card class="flex-row items-center justify-between p-6">
    <div>
      <p
        class="text-sm font-medium uppercase tracking-wider text-muted-foreground"
      >
        {{ title }}
      </p>
      <h2 class="text-4xl font-bold leading-tight text-foreground">
        {{ value }}
      </h2>
      <p v-if="subtitle" class="mt-1 text-xs text-muted-foreground">
        {{ subtitle }}
      </p>
    </div>
    <div
      v-if="$slots.icon"
      class="p-3 rounded-full"
      :style="{
        backgroundColor: iconBgColor || 'hsl(210 40% 96.1%)',
      }"
    >
      <div :style="{ color: iconColor || 'hsl(222.2 47.4% 11.2%)' }">
        <slot name="icon"></slot>
      </div>
    </div>
  </Card>
</template>
