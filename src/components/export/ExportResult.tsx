import React from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download05Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { useTerms } from "@/config/organization";
import { Button } from "@/components/ui/button";
import { fadeSlideUpVariants, useSmoothMotion } from "@/lib/motion";

export interface ExportReportRow {
  no: number;
  nama: string;
  jilid: string;
  guru: string;
  hadir: number;
  izin: number;
  alfa: number;
}

export interface ExportReportData {
  title: string;
  periodLabel: string;
  filterLabel: string;
  generatedAt: string;
  rows: ExportReportRow[];
  totalKehadiran: number;
  totalIzin: number;
  totalAlfa: number;
}

export interface ExportResultProps {
  report: ExportReportData | null;
  onExportPdf: () => void;
  onExportCsv: () => void;
}

export const ExportResult: React.FC<ExportResultProps> = ({
  report,
  onExportPdf,
  onExportCsv,
}) => {
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  if (!report) return null;

  return (
    <motion.div
      variants={fadeSlideUpVariants}
      initial={shouldReduceMotion ? false : "initial"}
      animate="animate"
      exit="exit"
      className="bg-card rounded-lg border border-border shadow-xs overflow-hidden"
    >
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">
            Preview Laporan
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {report.periodLabel} - {report.filterLabel}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          aria-label="Ringkasan laporan"
        >
          <div className="rounded-md border border-[hsl(142_42%_82%)] bg-[hsl(142_76%_97%)] p-3">
            <p className="text-[12px] text-[hsl(142_72%_29%)]">
              Total {terms.studentSingularTitle}
            </p>
            <p className="text-[20px] font-bold text-[hsl(142_72%_29%)]">
              {report.rows.length}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/60 p-3">
            <p className="text-[12px] text-muted-foreground">Total Kehadiran</p>
            <p className="text-[20px] font-bold text-foreground">
              {report.totalKehadiran}
            </p>
          </div>
          <div className="rounded-md border border-[hsl(48_76%_78%)] bg-[hsl(48_96%_97%)] p-3">
            <p className="text-[12px] text-[hsl(32_95%_35%)]">Total Izin</p>
            <p className="text-[20px] font-bold text-[hsl(32_95%_35%)]">
              {report.totalIzin}
            </p>
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-[12px] text-destructive">Total Alfa</p>
            <p className="text-[20px] font-bold text-destructive">
              {report.totalAlfa}
            </p>
          </div>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-border bg-card">
          <table className="min-w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th className="w-12 px-3 py-2 font-semibold">No</th>
                <th className="px-3 py-2 font-semibold">Nama</th>
                <th className="px-3 py-2 font-semibold">
                  {terms.levelSingularTitle}
                </th>
                <th className="px-3 py-2 font-semibold">
                  {terms.mentorSingularTitle}
                </th>
                <th className="w-16 px-3 py-2 text-right font-semibold">Hadir</th>
                <th className="w-16 px-3 py-2 text-right font-semibold">Izin</th>
                <th className="w-16 px-3 py-2 text-right font-semibold">Alfa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.rows.map((row) => (
                <tr key={row.no} className="hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{row.no}</td>
                  <td className="px-3 py-2 font-medium text-foreground">
                    {row.nama}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.jilid}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.guru}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                    {row.hadir}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-[hsl(32_95%_35%)]">
                    {row.izin}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-destructive">
                    {row.alfa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={onExportPdf}
            className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <HugeiconsIcon
              icon={PrinterIcon}
              size={20}
              color="currentColor"
              strokeWidth={2}
            />
            Cetak / Simpan PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onExportCsv}
            className="w-full h-11"
          >
            <HugeiconsIcon
              icon={Download05Icon}
              size={20}
              color="currentColor"
              strokeWidth={2}
            />
            Export CSV
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ExportResult;

