<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const props = defineProps<{
  isOpen: boolean;
  title: string;
  label: string;
  initialValue: string;
}>();

const emit = defineEmits<{
  (e: "confirm", value: string): void;
  (e: "cancel"): void;
}>();

const inputValue = ref("");

// Otomatis mengisi input dengan nama lama saat modal terbuka
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      inputValue.value = props.initialValue;
    }
  },
);

const handleConfirm = () => {
  if (!inputValue.value.trim()) return;
  emit("confirm", inputValue.value.trim());
};

const handleOpenChange = (open: boolean) => {
  if (!open) emit("cancel");
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-2">
        <Label>{{ label }}</Label>
        <Input
          v-model="inputValue"
          @keyup.enter="handleConfirm"
          type="text"
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          @click="emit('cancel')"
        >
          Batal
        </Button>
        <Button
          type="button"
          @click="handleConfirm"
        >
          Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
