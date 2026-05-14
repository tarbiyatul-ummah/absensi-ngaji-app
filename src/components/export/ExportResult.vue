<script setup lang="ts">
defineProps<{
  resultText: string;
}>();

const emit = defineEmits<{
  (e: "copy"): void;
}>();
</script>

<template>
  <div
    v-if="resultText"
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
  >
    <div
      class="p-4 border-b border-[#E1E3E5] flex justify-between items-center bg-[#FAFAFA]"
    >
      <h2 class="text-[14px] font-semibold text-[#202223]">Hasil Laporan</h2>
    </div>

    <div class="p-4 space-y-4">
      <div
        class="rounded-md border border-[#C9CCCF] bg-[#F4F6F8] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <textarea
          readonly
          :value="resultText"
          class="w-full h-64 bg-transparent p-3 text-[13px] text-[#454749] focus:outline-none resize-none leading-relaxed"
        ></textarea>
      </div>

      <button
        @click="emit('copy')"
        class="w-full rounded-md bg-[#008060] px-4 py-3 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] transition-colors flex items-center justify-center gap-2"
      >
        <!-- Ikon Copy/WhatsApp -->
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
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Salin Pesan ke WhatsApp
      </button>
    </div>
  </div>
</template>
