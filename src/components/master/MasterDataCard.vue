<script setup lang="ts">
import { ref } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Item {
  id: string;
  nama: string;
  urutan?: number; // Jadikan opsional agar Guru tetap bisa pakai komponen ini
}

const props = defineProps<{
  title: string;
  placeholder: string;
  items: Item[];
  isSortable?: boolean; // Prop baru untuk mengaktifkan tombol naik/turun
}>();

const emit = defineEmits<{
  (e: "add", nama: string): void;
  (e: "edit", item: Item): void;
  (e: "delete", id: string): void;
  (e: "moveUp", index: number): void;
  (e: "moveDown", index: number): void;
}>();

const inputNama = ref("");

const handleAdd = () => {
  if (!inputNama.value) return;
  emit("add", inputNama.value);
  inputNama.value = ""; // Reset input setelah emit
};
</script>

<template>
  <Card class="gap-0 py-0">
    <CardHeader class="border-b py-4">
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>

    <div class="border-b bg-background p-4">
      <div class="flex gap-2">
        <Input
          v-model="inputNama"
          type="text"
          :placeholder="placeholder"
          @keyup.enter="handleAdd"
        />
        <Button
          type="button"
          @click="handleAdd"
          class="whitespace-nowrap"
        >
          Tambah
        </Button>
      </div>
    </div>

    <div class="divide-y">
      <!-- Tambahkan index di v-for -->
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="flex items-center justify-between p-4 transition-colors hover:bg-accent"
      >
        <div class="flex items-center gap-3">
          <!-- Tombol Panah (Hanya muncul jika isSortable = true) -->
          <div
            v-if="isSortable"
            class="flex flex-col rounded border bg-muted"
          >
            <Button
              v-if="index > 0"
              type="button"
              variant="ghost"
              size="icon-xs"
              @click="emit('moveUp', index)"
              class="rounded-b-none text-muted-foreground"
            >
              <HugeiconsIcon
                :icon="ArrowUp01Icon"
                :size="14"
                color="currentColor"
                :stroke-width="2.5"
              />
            </Button>
            <!-- Spacer kosong agar panah bawah selalu sejajar walau panah atas hilang -->
            <div v-else class="p-1 h-[22px]"></div>

            <Button
              v-if="index < items.length - 1"
              type="button"
              variant="ghost"
              size="icon-xs"
              @click="emit('moveDown', index)"
              class="rounded-t-none text-muted-foreground"
            >
              <HugeiconsIcon
                :icon="ArrowDown01Icon"
                :size="14"
                color="currentColor"
                :stroke-width="2.5"
              />
            </Button>
          </div>

          <span class="text-sm font-medium text-foreground">{{
            item.nama
          }}</span>
        </div>

        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="emit('edit', item)"
            class="text-[13px]"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="emit('delete', item.id)"
            class="text-[13px] text-destructive hover:bg-red-50 hover:text-destructive"
          >
            Hapus
          </Button>
        </div>
      </div>

      <div
        v-if="items.length === 0"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        Belum ada data.
      </div>
    </div>
  </Card>
</template>
