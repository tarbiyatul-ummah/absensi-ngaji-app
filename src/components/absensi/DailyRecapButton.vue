<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import { ClipboardCopyIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { Santri, Attendance } from "../../types";
import { organizationConfig, terms } from "../../config/organization";

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
      alert(
        `Semua ${terms.studentSingularLower} pada filter ini sudah hadir atau izin!`,
      );
      return;
    }

    const names = absentSantri.map((s) => s.nama).join(", ");
    const message = `Izin menyampaikan rekap kehadiran ${organizationConfig.typeLabel} hari ini. Kami melihat nama-nama ${terms.studentSingularLower} di bawah ini belum hadir:\n\n${names}\n\nJika berhalangan hadir, mohon diinformasikan kepada ${terms.mentorSingularLower}. Terima kasih.`;

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
  <Button
    type="button"
    variant="outline"
    @click="generateDailyRecap"
    class="w-full"
  >
    <HugeiconsIcon
      :icon="ClipboardCopyIcon"
      :size="17"
      color="currentColor"
      :stroke-width="2"
    />
    Salin Rekap Belum Hadir (WA)
  </Button>
</template>
