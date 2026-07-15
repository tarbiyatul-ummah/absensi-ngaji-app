<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import { ClipboardCopyIcon } from "@hugeicons/core-free-icons";
import type { Santri, Attendance } from "../../types";

const props = defineProps<{
  filteredSantri: Santri[];
  attendanceData: Attendance[];
}>();

const emit = defineEmits(["success", "error"]);

const generateDailyRecap = async () => {
  try {
    // Logika filter: Cari santri yang tidak ada di attendanceData (belum diabsen)
    // ATAU yang belum hadir. Santri berstatus izin tidak ikut pesan WA.
    const absentSantri = props.filteredSantri.filter((santri) => {
      const record = props.attendanceData.find((a) => a.santriId === santri.id);
      if (!record) return true;

      const status = record.status ?? (record.isPresent ? "present" : "absent");
      return status === "absent";
    });

    if (absentSantri.length === 0) {
      alert("Semua santri pada filter ini sudah hadir atau izin!");
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
    <HugeiconsIcon
      :icon="ClipboardCopyIcon"
      :size="17"
      color="#6D7175"
      :stroke-width="2"
    />
    Salin Rekap Belum Hadir (WA)
  </button>
</template>
