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
      className="bg-card rounded-xl border border-border shadow-xs overflow-hidden"
    >
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Preview Laporan
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {report.periodLabel} - {report.filterLabel}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          aria-label="Ringkasan laporan"
        >
          <div className="rounded-xl border border-success-border bg-success-subtle p-3">
            <p className="text-xs text-success font-medium">
              Total {terms.studentSingularTitle}
            </p>
            <p className="text-xl font-bold text-success">
              {report.rows.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground font-medium">Total Kehadiran</p>
            <p className="text-xl font-bold text-foreground">
              {report.totalKehadiran}
            </p>
          </div>
          <div className="rounded-xl border border-warning-border bg-warning-subtle p-3">
            <p className="text-xs text-warning font-medium">Total Izin</p>
            <p className="text-xl font-bold text-warning">
              {report.totalIzin}
            </p>
          </div>
          <div className="rounded-xl border border-danger-border bg-danger-subtle p-3">
            <p className="text-xs text-danger font-medium">Total Alfa</p>
            <p className="text-xl font-bold text-danger">
              {report.totalAlfa}
            </p>
          </div>
        </div>

        <div className="max-h-80 overflow-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-muted-foreground">
              <tr>
                <th className="w-12 px-3 py-2.5 font-semibold">No</th>
                <th className="px-3 py-2.5 font-semibold">Nama</th>
                <th className="px-3 py-2.5 font-semibold">
                  {terms.levelSingularTitle}
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  {terms.mentorSingularTitle}
                </th>
                <th className="w-16 px-3 py-2.5 text-right font-semibold">Hadir</th>
                <th className="w-16 px-3 py-2.5 text-right font-semibold">Izin</th>
                <th className="w-16 px-3 py-2.5 text-right font-semibold">Alfa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.rows.map((row) => (
                <tr key={row.no} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 text-muted-foreground">{row.no}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    {row.nama}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.jilid}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.guru}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                    {row.hadir}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-warning">
                    {row.izin}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-danger">
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
            variant="success"
            onClick={onExportPdf}
            className="w-full h-10"
          >
            <HugeiconsIcon
              icon={PrinterIcon}
              size={18}
              color="currentColor"
              strokeWidth={2}
            />
            Cetak / Simpan PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onExportCsv}
            className="w-full h-10"
          >
            <HugeiconsIcon
              icon={Download05Icon}
              size={18}
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

