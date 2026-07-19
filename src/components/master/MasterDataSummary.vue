<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { terms } from "../../config/organization";

interface SummaryItem {
  nama: string;
  aktif: number;
}

type BreakdownTab = "jilid" | "asatidz" | "tipe";

const props = defineProps<{
  totalActive: number;
  jilidStats: SummaryItem[];
  guruStats: SummaryItem[];
  tipeStats: SummaryItem[];
}>();

const activeTab = ref<BreakdownTab>("jilid");

const tabs = computed(() => [
  {
    key: "jilid" as const,
    label: `Per ${terms.levelSingularTitle}`,
    items: props.jilidStats,
    empty: `Belum ada data ${terms.levelSingularLower}.`,
  },
  {
    key: "asatidz" as const,
    label: "Per Asatidz",
    items: props.guruStats,
    empty: `Belum ada data ${terms.mentorSingularLower}.`,
  },
  {
    key: "tipe" as const,
    label: "Per Tipe",
    items: props.tipeStats,
    empty: "Belum ada data tipe.",
  },
]);

const selectedTab = computed(
  () => tabs.value.find((tab) => tab.key === activeTab.value) ?? tabs.value[0],
);
</script>

<template>
  <section class="grid grid-cols-[minmax(112px,0.8fr)_minmax(0,1.2fr)] gap-3">
    <Card class="gap-0 py-0">
      <CardHeader class="px-4 pt-4 pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">
          {{ terms.studentSingularTitle }} Aktif
        </CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4">
        <p class="text-3xl font-semibold leading-none tracking-normal text-foreground">
          {{ totalActive }}
        </p>
      </CardContent>
    </Card>

    <Card class="min-w-0 gap-0 py-0">
      <CardHeader class="px-4 pt-4 pb-2">
        <div class="inline-flex w-fit max-w-full justify-self-start rounded-md bg-muted p-1">
          <Button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            variant="ghost"
            size="xs"
            :class="
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-xs hover:bg-background'
                : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </Button>
        </div>
      </CardHeader>

      <CardContent class="px-4 pb-4">
        <div class="flex max-h-28 flex-wrap gap-x-4 gap-y-1.5 overflow-y-auto pr-1 text-sm leading-6">
          <span
            v-for="item in selectedTab.items"
            :key="item.nama"
            class="min-w-0 break-words text-foreground"
          >
            <span class="font-medium">{{ item.nama }}</span>:
            <span class="font-semibold">{{ item.aktif }}</span>
          </span>

          <p
            v-if="selectedTab.items.length === 0"
            class="text-sm text-muted-foreground"
          >
            {{ selectedTab.empty }}
          </p>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
