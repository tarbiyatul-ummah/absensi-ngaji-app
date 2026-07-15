<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
  <Card class="gap-0 py-0">
    <CardHeader class="border-b py-4">
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <div class="divide-y">
      <div
        v-for="stat in items"
        :key="stat.nama"
        class="flex items-center justify-between px-4 py-3 hover:bg-accent"
      >
        <span class="text-sm text-foreground">{{ stat.nama }}</span>
        <Badge
          variant="outline"
          class="text-sm font-bold"
          :class="{
            'bg-secondary text-secondary-foreground':
              badgeColor !== 'green' && badgeColor !== 'red',
            'bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)] border-[hsl(142_42%_82%)]':
              badgeColor === 'green',
            'bg-[hsl(0_86%_97%)] text-destructive border-[hsl(0_75%_88%)]':
              badgeColor === 'red',
          }"
        >
          {{ stat.count }}
          <span
            class="text-[12px] font-normal"
            :class="{
              'text-muted-foreground':
                badgeColor !== 'green' && badgeColor !== 'red',
              'text-[hsl(142_72%_29%)]': badgeColor === 'green',
              'text-destructive': badgeColor === 'red',
            }"
            >{{ unit || "Anak" }}</span
          >
        </Badge>
      </div>
      <div
        v-if="items.length === 0"
        class="px-4 py-6 text-center text-sm text-muted-foreground"
      >
        Tidak ada data
      </div>
    </div>
  </Card>
</template>
