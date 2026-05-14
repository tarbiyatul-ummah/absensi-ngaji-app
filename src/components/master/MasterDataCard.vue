<script setup lang="ts">
import { ref } from "vue";

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
  <div
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div class="p-4 border-b border-[#E1E3E5] bg-[#FAFAFA]">
      <h2 class="text-[14px] font-semibold text-[#202223]">{{ title }}</h2>
    </div>

    <div class="p-4 border-b border-[#E1E3E5] bg-white">
      <div class="flex gap-2">
        <input
          v-model="inputNama"
          type="text"
          :placeholder="placeholder"
          @keyup.enter="handleAdd"
          class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-shadow"
        />
        <button
          @click="handleAdd"
          class="rounded-md bg-[#008060] px-4 py-2 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] transition-colors whitespace-nowrap"
        >
          Tambah
        </button>
      </div>
    </div>

    <div class="divide-y divide-[#E1E3E5]">
      <!-- Tambahkan index di v-for -->
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="flex justify-between items-center p-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <div class="flex items-center gap-3">
          <!-- Tombol Panah (Hanya muncul jika isSortable = true) -->
          <div
            v-if="isSortable"
            class="flex flex-col bg-[#F4F6F8] rounded border border-[#E1E3E5]"
          >
            <button
              v-if="index > 0"
              @click="emit('moveUp', index)"
              class="p-1 text-[#8C9196] hover:text-[#202223] hover:bg-[#E4E5E7] transition-colors rounded-t"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 15.75l7.5-7.5 7.5 7.5"
                />
              </svg>
            </button>
            <!-- Spacer kosong agar panah bawah selalu sejajar walau panah atas hilang -->
            <div v-else class="p-1 h-[22px]"></div>

            <button
              v-if="index < items.length - 1"
              @click="emit('moveDown', index)"
              class="p-1 text-[#8C9196] hover:text-[#202223] hover:bg-[#E4E5E7] transition-colors rounded-b"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>

          <span class="text-[14px] font-medium text-[#202223]">{{
            item.nama
          }}</span>
        </div>

        <div class="flex gap-2">
          <button
            @click="emit('edit', item)"
            class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#F4F6F8] transition-colors"
          >
            Edit
          </button>
          <button
            @click="emit('delete', item.id)"
            class="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#D82C0D] hover:bg-[#FFF4F4] active:bg-[#FCE8E8] transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>

      <div
        v-if="items.length === 0"
        class="p-8 text-center text-[#6D7175] text-[14px]"
      >
        Belum ada data.
      </div>
    </div>
  </div>
</template>
