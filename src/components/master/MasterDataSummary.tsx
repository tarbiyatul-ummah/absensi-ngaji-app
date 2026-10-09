import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTerms } from "@/config/organization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MasterSummaryItem {
  nama: string;
  aktif: number;
}

export type BreakdownTab = "jilid" | "asatidz" | "tipe";

export interface MasterDataSummaryProps {
  totalActive: number;
  jilidStats: MasterSummaryItem[];
  guruStats: MasterSummaryItem[];
  tipeStats: MasterSummaryItem[];
}

export const MasterDataSummary: React.FC<MasterDataSummaryProps> = ({
  totalActive,
  jilidStats,
  guruStats,
  tipeStats,
}) => {
  const terms = useTerms();
  const [activeTab, setActiveTab] = useState<BreakdownTab>("jilid");

  const tabs = useMemo(
    () => [
      {
        key: "jilid" as const,
        label: `Per ${terms.levelSingularTitle}`,
        items: jilidStats,
        empty: `Belum ada data ${terms.levelSingularLower}.`,
      },
      {
        key: "asatidz" as const,
        label: "Per Asatidz",
        items: guruStats,
        empty: `Belum ada data ${terms.mentorSingularLower}.`,
      },
      {
        key: "tipe" as const,
        label: "Per Tipe",
        items: tipeStats,
        empty: "Belum ada data tipe.",
      },
    ],
    [terms, jilidStats, guruStats, tipeStats],
  );

  const selectedTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <section className="grid grid-cols-[minmax(112px,0.8fr)_minmax(0,1.2fr)] gap-3">
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {terms.studentSingularTitle} Aktif
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-semibold leading-none tracking-normal text-foreground">
            {totalActive}
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          {/* Mobile dropdown kecil dengan style popover kartu */}
          <div className="w-fit max-w-full sm:hidden">
            <Select
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as BreakdownTab)}
            >
              <SelectTrigger className="h-7 w-auto min-w-[105px] rounded-lg border-border bg-muted/60 px-2.5 text-xs font-medium shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {tabs.map((tab) => (
                  <SelectItem key={tab.key} value={tab.key}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop tabs */}
          <div className="hidden sm:inline-flex w-fit max-w-full justify-self-start rounded-xl bg-muted p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 rounded-lg px-2.5 text-xs font-medium ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-xs hover:bg-card"
                    : "text-muted-foreground hover:bg-transparent hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="flex max-h-28 flex-wrap gap-x-4 gap-y-1.5 overflow-y-auto pr-1 text-sm leading-6">
            {selectedTab.items.map((item) => (
              <span
                key={item.nama}
                className="min-w-0 break-words text-foreground"
              >
                <span className="font-medium">{item.nama}</span>:{" "}
                <span className="font-semibold">{item.aktif}</span>
              </span>
            ))}

            {selectedTab.items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedTab.empty}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default MasterDataSummary;

