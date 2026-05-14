<script setup lang="ts">
import { ref, onMounted } from "vue";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import type { Santri, Jilid, Guru } from "../types";

const selectedMonth = ref("");
const filterType = ref("semua"); // 'semua', 'jilid', 'guru'
const filterId = ref("");
const resultText = ref("");
const isGenerating = ref(false);

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);

onMounted(async () => {
  // Set default bulan ke bulan saat ini (YYYY-MM)
  const now = new Date();
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  santriList.value = await getSantri();
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
});

const generateExport = async () => {
  if (!selectedMonth.value) return alert("Pilih bulan terlebih dahulu.");
  if (filterType.value !== "semua" && !filterId.value)
    return alert("Pilih spesifik Jilid/Guru terlebih dahulu.");

  isGenerating.value = true;

  try {
    const start = `${selectedMonth.value}-01`;
    const end = `${selectedMonth.value}-31`;

    // 1. Ambil semua absensi yang HADIR di bulan tersebut
    const q = query(
      collection(db, "attendances"),
      where("date", ">=", start),
      where("date", "<=", end),
      where("isPresent", "==", true),
    );
    const attendanceSnapshot = await getDocs(q);

    // Hitung kemunculan tiap santriId (Total Kehadiran)
    const attendanceCount: Record<string, number> = {};
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceCount[data.santriId] =
        (attendanceCount[data.santriId] || 0) + 1;
    });

    // 2. Filter Santri Aktif sesuai pilihan (Semua / Jilid / Guru)
    let filteredSantri = santriList.value.filter((s) => s.isActive);
    if (filterType.value === "jilid") {
      filteredSantri = filteredSantri.filter(
        (s) => s.jilidId === filterId.value,
      );
    } else if (filterType.value === "guru") {
      filteredSantri = filteredSantri.filter(
        (s) => s.guruId === filterId.value,
      );
    }

    if (filteredSantri.length === 0) {
      resultText.value = "Tidak ada data santri untuk filter tersebut.";
      isGenerating.value = false;
      return;
    }

    // 3. Susun Teks WhatsApp
    const dateObj = new Date(start);
    const namaBulan = dateObj.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    let text = `Assalamualaikum bapak/ibu, berikut adalah rekap kehadiran bulan ${namaBulan} Ananda di LPQ Tarbiyatul Ummah:\n\n`;

    filteredSantri.forEach((santri, index) => {
      const total = attendanceCount[santri.id] || 0;
      text += `${index + 1}. ${santri.nama}: ${total}\n`;
    });

    text += `\nDimohon untuk Ananda yang kehadirannya masih di Bawah 20 setiap bulan, untuk ditingkatkan semangatnya untuk masuk.`;

    resultText.value = text;
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat menarik data.");
  } finally {
    isGenerating.value = false;
  }
};

const copyText = () => {
  if (!resultText.value) return;
  navigator.clipboard.writeText(resultText.value);
  alert("Teks berhasil disalin ke Clipboard! Silakan Paste di WhatsApp.");
};
</script>

<template>
  <div class="pb-24 font-sans">
    <!-- Header Shopify Style -->
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <h1 class="text-[20px] font-bold text-[#202223]">Export Rekap WA</h1>
    </header>

    <div class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Card Konfigurasi Export -->
      <div
        class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
      >
        <div class="p-4 border-b border-[#E1E3E5] bg-[#FAFAFA]">
          <h2 class="text-[14px] font-semibold text-[#202223]">
            Pengaturan Rekap
          </h2>
        </div>

        <div class="p-4 space-y-4">
          <!-- Input Bulan -->
          <div>
            <label class="block text-[13px] text-[#202223] font-medium mb-1.5"
              >Pilih Bulan</label
            >
            <input
              type="month"
              v-model="selectedMonth"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer"
            />
          </div>

          <!-- Filter Tipe -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="w-full">
              <label class="block text-[13px] text-[#202223] font-medium mb-1.5"
                >Target Penerima</label
              >
              <select
                v-model="filterType"
                @change="filterId = ''"
                class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
              >
                <option value="semua">Semua Santri</option>
                <option value="jilid">Berdasarkan Jilid</option>
                <option value="guru">Berdasarkan Guru</option>
              </select>
            </div>

            <!-- Conditional Dropdown (Muncul jika Jilid/Guru dipilih) -->
            <div
              v-if="filterType !== 'semua'"
              class="w-full animate-in fade-in duration-200"
            >
              <label
                class="block text-[13px] text-[#202223] font-medium mb-1.5"
              >
                Pilih {{ filterType === "jilid" ? "Jilid" : "Guru" }}
              </label>
              <select
                v-model="filterId"
                class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
              >
                <option value="" disabled>Pilih spesifik...</option>
                <template v-if="filterType === 'jilid'">
                  <option
                    v-for="jilid in jilidList"
                    :key="jilid.id"
                    :value="jilid.id"
                  >
                    {{ jilid.nama }}
                  </option>
                </template>
                <template v-else>
                  <option
                    v-for="guru in guruList"
                    :key="guru.id"
                    :value="guru.id"
                  >
                    {{ guru.nama }}
                  </option>
                </template>
              </select>
            </div>
          </div>

          <div class="pt-2">
            <button
              @click="generateExport"
              :disabled="isGenerating"
              class="w-full rounded-md bg-[#202223] px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#454749] active:bg-[#111213] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                v-if="!isGenerating"
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isGenerating ? "Menyusun Data..." : "Buat Rekap" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Card Hasil Export -->
      <div
        v-if="resultText"
        class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div
          class="p-4 border-b border-[#E1E3E5] flex justify-between items-center bg-[#FAFAFA]"
        >
          <h2 class="text-[14px] font-semibold text-[#202223]">
            Hasil Laporan
          </h2>
        </div>

        <div class="p-4 space-y-4">
          <div
            class="rounded-md border border-[#C9CCCF] bg-[#F4F6F8] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <textarea
              readonly
              v-model="resultText"
              class="w-full h-64 bg-transparent p-3 text-[13px] text-[#454749] focus:outline-none resize-none leading-relaxed"
            ></textarea>
          </div>

          <button
            @click="copyText"
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
    </div>
  </div>
</template>
