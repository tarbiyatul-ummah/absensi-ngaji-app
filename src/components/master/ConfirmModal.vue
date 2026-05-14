<script setup lang="ts">
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
</script>

<template>
  <!-- Backdrop (Latar Gelap) -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,34,35,0.8)] px-4 transition-opacity"
  >
    <!-- Modal Box -->
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
      <div class="px-5 py-6">
        <p class="text-[14px] text-[#454749] leading-relaxed">
          {{ message }}
        </p>
      </div>

      <!-- Footer -->
      <div
        class="px-5 py-4 border-t border-[#E1E3E5] bg-[#FAFAFA] flex justify-end gap-3"
      >
        <button
          @click="emit('cancel')"
          class="px-4 py-2 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#F4F6F8] transition-colors"
        >
          Batal
        </button>
        <button
          @click="emit('confirm')"
          class="px-4 py-2 rounded-md text-[13px] font-medium text-white bg-[#D82C0D] shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#BC2200] active:bg-[#A11B00] transition-colors"
        >
          {{ confirmText || "Hapus" }}
        </button>
      </div>
    </div>
  </div>
</template>
