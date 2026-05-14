<script setup lang="ts">
import { watch } from "vue";

const props = defineProps<{
  show: boolean;
  message: string;
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
        <svg
          class="w-4 h-4 text-[#008060]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        {{ message }}
      </div>
    </div>
  </Transition>
</template>
