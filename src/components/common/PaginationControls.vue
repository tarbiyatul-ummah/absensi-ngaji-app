<script setup lang="ts">
defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  visibleStart: number;
  visibleEnd: number;
  itemLabel?: string;
}>();

const emit = defineEmits<{
  (e: "update:currentPage", page: number): void;
}>();
</script>

<template>
  <div
    v-if="totalItems > 0"
    class="p-4 border-t border-[#E1E3E5] flex flex-col gap-3 bg-[#FAFAFA] sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-[12px] text-[#6D7175]">
      Menampilkan {{ visibleStart }}-{{ visibleEnd }} dari {{ totalItems }}
      {{ itemLabel || "data" }}
    </p>

    <div class="flex items-center gap-2">
      <button
        type="button"
        @click="emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sebelumnya
      </button>
      <span class="text-[13px] text-[#454749]">
        Halaman {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        type="button"
        @click="emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Berikutnya
      </button>
    </div>
  </div>
</template>
