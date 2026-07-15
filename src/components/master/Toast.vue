<script setup lang="ts">
import { watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

const props = defineProps<{
  show: boolean;
  message: string;
  type?: "success" | "error";
  duration?: number;
}>();

const emit = defineEmits(["close"]);

// Gunakan watch agar setiap kali show berubah jadi true, timer jalan lagi
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        emit("close");
      }, props.duration || 3000);
    }
  },
);
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <!-- Tambahkan v-if agar transisi bekerja -->
    <div
      v-if="show"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-max"
    >
      <div
        class="bg-[#202223] text-white text-[13px] px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <HugeiconsIcon
          v-if="type !== 'error'"
          :icon="CheckmarkCircle02Icon"
          :size="16"
          color="#008060"
          :stroke-width="2"
        />
        <HugeiconsIcon
          v-else
          :icon="CancelCircleIcon"
          :size="16"
          color="#D72C0D"
          :stroke-width="2"
        />
        {{ message }}
      </div>
    </div>
  </Transition>
</template>
