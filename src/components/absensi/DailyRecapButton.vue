<script setup lang="ts">
import type { Santri, Attendance } from "../../types";

const props = defineProps<{
  filteredSantri: Santri[];
  attendanceData: Attendance[];
}>();

const emit = defineEmits(["success", "error"]);

const generateDailyRecap = async () => {
  try {
    // Logika filter: Cari santri yang tidak ada di attendanceData (belum diabsen)
    // ATAU yang isPresent-nya false
    const absentSantri = props.filteredSantri.filter((santri) => {
      const record = props.attendanceData.find((a) => a.santriId === santri.id);
      return !record || record.isPresent === false;
    });

    if (absentSantri.length === 0) {
      alert("Semua santri pada filter ini sudah hadir!");
      return;
    }

    const names = absentSantri.map((s) => s.nama).join(", ");
    const message = `Bismillah bapak/ibu, izin menyampaikan rekap kehadiran hari ini setelah membaca do'a pembuka, kami melihat nama-nama siswa di bawah ini belum hadir, di antaranya\n\n${names}\n\nJika berhalangan untuk hadir mengaji, mohon diinformasikan kepada ustadz/ustadzahnya nggih. Terima kasih.`;

    // Gunakan Clipboard API dengan fallback untuk mobile
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
      emit("success", "Rekap berhasil disalin!");
    } else {
      // Fallback untuk browser lama/non-HTTPS
      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      emit("success", "Rekap berhasil disalin!");
    }
  } catch (err) {
    emit("error", "Gagal menyalin teks.");
  }
};
</script>

<template>
  <button
    @click="generateDailyRecap"
    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#C9CCCF] bg-white text-[13px] font-medium text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] active:bg-[#F4F6F8] transition-all"
  >
    <svg
      class="w-4 h-4 text-[#6D7175]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
    Salin Rekap Belum Hadir (WA)
  </button>
</template>
