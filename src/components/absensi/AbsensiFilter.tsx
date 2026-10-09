import React from "react";
import type { Jilid } from "@/types";
import { FilterChip } from "@/components/ui/filter-chip";

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
  const allItems = [{ id: "Semua", nama: "Semua" }, ...jilidList];

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 items-center">
      {allItems.map((jilid) => (
        <FilterChip
          key={jilid.id}
          label={jilid.nama}
          isActive={selectedJilid === jilid.id}
          onClick={() => onSelectJilid(jilid.id)}
        />
      ))}
    </div>
  );
};

export default AbsensiFilter;

