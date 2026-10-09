import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClipboardCopyIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { Attendance, Santri } from "@/types";
import { useOrganizationConfig, useTerms } from "@/config/organization";

export interface DailyRecapButtonProps {
  filteredSantri: Santri[];
  attendanceData: Attendance[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const DailyRecapButton: React.FC<DailyRecapButtonProps> = ({
  filteredSantri,
  attendanceData,
  onSuccess,
  onError,
}) => {
  const orgConfig = useOrganizationConfig();
  const terms = useTerms();

  const generateDailyRecap = async () => {
    try {
      const absentSantri = filteredSantri.filter((santri) => {
        const record = attendanceData.find((a) => a.santriId === santri.id);
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
      const message = `Izin menyampaikan rekap kehadiran ${orgConfig.typeLabel} hari ini. Kami melihat nama-nama ${terms.studentSingularLower} di bawah ini belum hadir:\n\n${names}\n\nJika berhalangan hadir, mohon diinformasikan kepada ${terms.mentorSingularLower}. Terima kasih.`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        onSuccess("Rekap berhasil disalin!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        onSuccess("Rekap berhasil disalin!");
      }
    } catch {
      onError("Gagal menyalin teks.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={generateDailyRecap}
      className="w-full"
    >
      <HugeiconsIcon
        icon={ClipboardCopyIcon}
        size={17}
        color="currentColor"
        strokeWidth={2}
      />
      Salin Rekap Belum Hadir (WA)
    </Button>
  );
};

export default DailyRecapButton;

