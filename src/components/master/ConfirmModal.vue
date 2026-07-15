<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const handleOpenChange = (open: boolean) => {
  if (!open) emit("cancel");
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ message }}
        </DialogDescription>
      </DialogHeader>

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
          variant="destructive"
          @click="emit('confirm')"
        >
          {{ confirmText || "Hapus" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
