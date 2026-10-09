import React from "react";
import { motion } from "motion/react";
import type { Jilid } from "@/types";
import { useSmoothMotion, springSnappy } from "@/lib/motion";

export interface AbsensiFilterProps {
  jilidList: Jilid[];
  selectedJilid: string;
  onSelectJilid: (id: string) => void;
}

export const AbsensiFilter: React.FC<AbsensiFilterProps> = ({
  jilidList,
  selectedJilid,
  onSelectJilid,
}) => {
  const { shouldReduceMotion } = useSmoothMotion();
  const allItems = [{ id: "Semua", nama: "Semua" }, ...jilidList];

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 items-center">
      {allItems.map((jilid) => {
        const isSelected = selectedJilid === jilid.id;
        return (
          <motion.button
            key={jilid.id}
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            transition={springSnappy}
            onClick={() => onSelectJilid(jilid.id)}
            className={`relative whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer select-none ${
              isSelected
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {isSelected && !shouldReduceMotion && (
              <motion.div
                layoutId="absensi-jilid-pill"
                className="absolute inset-0 bg-secondary rounded-full -z-10 shadow-xs"
                transition={springSnappy}
              />
            )}
            {isSelected && shouldReduceMotion && (
              <div className="absolute inset-0 bg-secondary rounded-full -z-10 shadow-xs" />
            )}
            {jilid.nama}
          </motion.button>
        );
      })}
    </div>
  );
};

export default AbsensiFilter;

