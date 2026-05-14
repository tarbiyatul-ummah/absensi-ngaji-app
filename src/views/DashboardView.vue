<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import type { Santri, Jilid, Guru } from "../types";

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const [resSantri, resJilid, resGuru] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
    ]);
    santriList.value = resSantri.filter((s) => s.isActive);
    jilidList.value = resJilid;
    guruList.value = resGuru;
  } finally {
    isLoading.value = false;
  }
});

// 1. Total Seluruh Siswa Aktif
const totalSantri = computed(() => santriList.value.length);

// 2. Statistik berdasarkan Jilid
const jilidStats = computed(() => {
  return jilidList.value
    .map((jilid) => ({
      nama: jilid.nama,
      count: santriList.value.filter((s) => s.jilidId === jilid.id).length,
    }))
    .sort((a, b) => b.count - a.count); // Urutkan dari yang terbanyak
});

// 3. Statistik berdasarkan Guru
const guruStats = computed(() => {
  return guruList.value
    .map((guru) => ({
      nama: guru.nama,
      count: santriList.value.filter((s) => s.guruId === guru.id).length,
    }))
    .sort((a, b) => b.count - a.count);
});
</script>

<template>
  <div class="pb-24 font-sans bg-[#F6F6F7] min-h-screen">
    <header class="px-4 pt-6 pb-4 max-w-3xl mx-auto">
      <h1 class="text-[20px] font-bold text-[#202223]">Dashboard Rekap</h1>
      <p class="text-[14px] text-[#6D7175]">
        Ringkasan data santri aktif saat ini
      </p>
    </header>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008060]"
      ></div>
    </div>

    <div v-else class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Card: Total Utama -->
      <div
        class="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] flex items-center justify-between"
      >
        <div>
          <p
            class="text-[14px] font-medium text-[#6D7175] uppercase tracking-wider"
          >
            Total Seluruh Santri
          </p>
          <h2 class="text-[36px] font-bold text-[#202223] leading-tight">
            {{ totalSantri }}
          </h2>
        </div>
        <div class="bg-[#E3F1DF] p-3 rounded-full">
          <svg
            class="w-8 h-8 text-[#008060]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Seksi Jilid -->
        <div
          class="bg-white rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-[#F1F2F3] bg-[#FAFAFA]">
            <h3 class="text-[14px] font-bold text-[#202223]">
              Berdasarkan Jilid
            </h3>
          </div>
          <div class="divide-y divide-[#F1F2F3]">
            <div
              v-for="stat in jilidStats"
              :key="stat.nama"
              class="px-4 py-3 flex justify-between items-center hover:bg-[#F9FAFB]"
            >
              <span class="text-[14px] text-[#454749]">{{ stat.nama }}</span>
              <span
                class="text-[14px] font-bold text-[#202223] bg-[#F4F6F8] px-2.5 py-0.5 rounded-full border border-[#E1E3E5]"
              >
                {{ stat.count }}
                <span class="text-[12px] font-normal text-[#6D7175]">Anak</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Seksi Guru -->
        <div
          class="bg-white rounded-xl shadow-[0_1px_3px_rgba(63,63,68,0.15)] border border-[#E1E3E5] overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-[#F1F2F3] bg-[#FAFAFA]">
            <h3 class="text-[14px] font-bold text-[#202223]">
              Berdasarkan Guru
            </h3>
          </div>
          <div class="divide-y divide-[#F1F2F3]">
            <div
              v-for="stat in guruStats"
              :key="stat.nama"
              class="px-4 py-3 flex justify-between items-center hover:bg-[#F9FAFB]"
            >
              <span class="text-[14px] text-[#454749]">{{ stat.nama }}</span>
              <span
                class="text-[14px] font-bold text-[#008060] bg-[#E3F1DF] px-2.5 py-0.5 rounded-full"
              >
                {{ stat.count }}
                <span class="text-[12px] font-normal text-[#008060]">Anak</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
