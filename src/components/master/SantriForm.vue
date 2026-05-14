<script setup lang="ts">
import { ref } from "vue";
import type { Jilid, Guru } from "../../types";

const props = defineProps<{
  jilidList: Jilid[];
  guruList: Guru[];
}>();

const emit = defineEmits<{
  (e: "submit", data: { nama: string; jilidId: string; guruId: string }): void;
}>();

const inputNama = ref("");
const selectedJilid = ref("");
const selectedGuru = ref("");

const handleSubmit = () => {
  if (!inputNama.value || !selectedJilid.value || !selectedGuru.value) {
    return alert("Lengkapi data terlebih dahulu");
  }

  emit("submit", {
    nama: inputNama.value,
    jilidId: selectedJilid.value,
    guruId: selectedGuru.value,
  });

  inputNama.value = ""; // Reset form setelah submit
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div class="p-4 border-b border-[#E1E3E5] bg-[#FAFAFA]">
      <h2 class="text-[14px] font-semibold text-[#202223]">
        Tambah Santri Baru
      </h2>
    </div>
    <div class="p-4 space-y-4">
      <div>
        <label class="block text-[13px] text-[#202223] mb-1">Nama Santri</label>
        <textarea
          v-model="inputNama"
          placeholder="Pisahkan dengan koma (contoh: Budi, Andi)"
          class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-shadow"
          rows="2"
        ></textarea>
      </div>

      <div class="flex gap-3">
        <div class="w-full">
          <label class="block text-[13px] text-[#202223] mb-1">Jilid</label>
          <select
            v-model="selectedJilid"
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <option value="" disabled>Pilih Jilid</option>
            <option
              v-for="jilid in jilidList"
              :key="jilid.id"
              :value="jilid.id"
            >
              {{ jilid.nama }}
            </option>
          </select>
        </div>
        <div class="w-full">
          <label class="block text-[13px] text-[#202223] mb-1">Guru</label>
          <select
            v-model="selectedGuru"
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <option value="" disabled>Pilih Guru</option>
            <option v-for="guru in guruList" :key="guru.id" :value="guru.id">
              {{ guru.nama }}
            </option>
          </select>
        </div>
      </div>

      <div class="pt-2">
        <button
          @click="handleSubmit"
          class="w-full md:w-auto rounded-md bg-[#008060] px-4 py-2 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] transition-colors flex items-center justify-center gap-2"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Simpan Data
        </button>
      </div>
    </div>
  </div>
</template>
