<script setup lang="ts">
import { ref, watch } from "vue";

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
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,34,35,0.8)] px-4 transition-opacity"
  >
    <div
      class="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div
        class="px-5 py-4 border-b border-[#E1E3E5] flex justify-between items-center"
      >
        <h2 class="text-[16px] font-bold text-[#202223]">{{ title }}</h2>
        <button
          @click="emit('cancel')"
          class="text-[#6D7175] hover:text-[#202223] transition-colors p-1 rounded-md hover:bg-[#F4F6F8]"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-5 py-6 space-y-2">
        <label class="block text-[13px] text-[#202223] font-medium">{{
          label
        }}</label>
        <input
          v-model="inputValue"
          @keyup.enter="handleConfirm"
          type="text"
          class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
        />
      </div>

      <!-- Footer -->
      <div
        class="px-5 py-4 border-t border-[#E1E3E5] bg-[#FAFAFA] flex justify-end gap-3"
      >
        <button
          @click="emit('cancel')"
          class="px-4 py-2 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
        >
          Batal
        </button>
        <button
          @click="handleConfirm"
          class="px-4 py-2 rounded-md text-[13px] font-medium text-white bg-[#008060] shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] transition-colors"
        >
          Simpan
        </button>
      </div>
    </div>
  </div>
</template>
