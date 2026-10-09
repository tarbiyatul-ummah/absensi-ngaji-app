import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attendance, AttendanceStatus, Jilid, Santri } from "@/types";
import { useTerms } from "@/config/organization";
import { springSnappy, useSmoothMotion } from "@/lib/motion";

export interface AbsensiListProps {
  filteredSantri: Santri[];
  jilidList: Jilid[];
  attendanceData: Attendance[];
  savingSantriIds?: Set<string>;
  onStatusChange: (santri: Santri, status: AttendanceStatus) => void;
}

export const AbsensiList: React.FC<AbsensiListProps> = ({
  filteredSantri,
  jilidList,
  attendanceData,
  savingSantriIds,
  onStatusChange,
}) => {
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const jilidMap = useMemo(() => {
    return new Map(jilidList.map((j) => [j.id, j.nama]));
  }, [jilidList]);

  const attendanceMap = useMemo(() => {
    return new Map(attendanceData.map((a) => [a.santriId, a]));
  }, [attendanceData]);

  const getAttendanceStatus = (santriId: string): AttendanceStatus => {
    const record = attendanceMap.get(santriId);
    if (!record) return "absent";
    if (record.status) return record.status;
    return record.isPresent ? "present" : "absent";
  };

  const isSaving = (santriId: string) => {
    return savingSantriIds?.has(santriId) ?? false;
  };

  const getButtonClass = (santriId: string, status: AttendanceStatus) => {
    const activeStatus = getAttendanceStatus(santriId);
    const isActive = activeStatus === status;

    if (status === "present") {
      return isActive
        ? "border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)] shadow-sm"
        : "border-border bg-background text-foreground hover:bg-accent";
    }

    return isActive
      ? "border-[hsl(48_76%_78%)] bg-[hsl(48_96%_89%)] text-[hsl(32_95%_35%)] shadow-sm"
      : "border-border bg-background text-foreground hover:bg-accent";
  };

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between border-b py-4">
        <CardTitle>Daftar Kehadiran</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {filteredSantri.length} {terms.studentSingularTitle}
        </span>
      </CardHeader>

      <div className="divide-y divide-border">
        {filteredSantri.map((santri) => {
          const status = getAttendanceStatus(santri.id);
          const saving = isSaving(santri.id);

          return (
            <div
              key={santri.id}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {santri.nama}
                </span>
                <span className="text-xs text-muted-foreground">
                  {jilidMap.get(santri.jilidId) || "N/A"}
                </span>
              </div>

              <div
                className={`grid grid-cols-2 gap-2 sm:w-44 ${
                  saving ? "cursor-wait opacity-70" : ""
                }`}
                role="group"
                aria-label={`Status absensi ${santri.nama}`}
              >
                <motion.button
                  type="button"
                  whileTap={
                    shouldReduceMotion || saving
                      ? undefined
                      : { scale: 0.94 }
                  }
                  transition={springSnappy}
                  className={`inline-flex items-center justify-center rounded-lg border h-9 px-3 text-[13px] font-semibold transition-colors disabled:cursor-wait ${getButtonClass(
                    santri.id,
                    "present"
                  )}`}
                  disabled={saving}
                  aria-pressed={status === "present"}
                  onClick={() => onStatusChange(santri, "present")}
                >
                  Hadir
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={
                    shouldReduceMotion || saving
                      ? undefined
                      : { scale: 0.94 }
                  }
                  transition={springSnappy}
                  className={`inline-flex items-center justify-center rounded-lg border h-9 px-3 text-[13px] font-semibold transition-colors disabled:cursor-wait ${getButtonClass(
                    santri.id,
                    "permission"
                  )}`}
                  disabled={saving}
                  aria-pressed={status === "permission"}
                  onClick={() => onStatusChange(santri, "permission")}
                >
                  Izin
                </motion.button>
              </div>
            </div>
          );
        })}

        {filteredSantri.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada data {terms.studentSingularLower} untuk filter ini.
          </div>
        )}
      </div>
    </Card>
  );
};

export default AbsensiList;
