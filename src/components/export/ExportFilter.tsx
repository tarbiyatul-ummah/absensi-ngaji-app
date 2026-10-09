import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileDownloadIcon } from "@hugeicons/core-free-icons";
import type { Guru, Jilid } from "@/types";
import type {
  AcademicMonthOption,
  AcademicPeriodType,
  AcademicSemester,
  AcademicYearOption,
} from "@/utils/academicPeriod";
import { useTerms } from "@/config/organization";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ExportFilterProps {
  startDate: string;
  endDate: string;
  periodType: AcademicPeriodType;
  academicYearStart: number;
  semester: AcademicSemester;
  selectedMonth: string;
  academicYearOptions: AcademicYearOption[];
  academicMonthOptions: AcademicMonthOption[];
  filterType: string;
  filterId: string;
  jilidList: Jilid[];
  guruList: Guru[];
  isGenerating: boolean;
  onUpdateStartDate: (value: string) => void;
  onUpdateEndDate: (value: string) => void;
  onUpdatePeriodType: (value: AcademicPeriodType) => void;
  onUpdateAcademicYearStart: (value: number) => void;
  onUpdateSemester: (value: AcademicSemester) => void;
  onUpdateSelectedMonth: (value: string) => void;
  onUpdateFilterType: (value: string) => void;
  onUpdateFilterId: (value: string) => void;
  onGenerate: () => void;
}

export const ExportFilter: React.FC<ExportFilterProps> = ({
  startDate,
  endDate,
  periodType,
  academicYearStart,
  semester,
  selectedMonth,
  academicYearOptions,
  academicMonthOptions,
  filterType,
  filterId,
  jilidList,
  guruList,
  isGenerating,
  onUpdateStartDate,
  onUpdateEndDate,
  onUpdatePeriodType,
  onUpdateAcademicYearStart,
  onUpdateSemester,
  onUpdateSelectedMonth,
  onUpdateFilterType,
  onUpdateFilterId,
  onGenerate,
}) => {
  const terms = useTerms();

  const handlePeriodSelect = (type: AcademicPeriodType) => {
    onUpdatePeriodType(type);
  };

  const handleFilterTypeChange = (value: string) => {
    onUpdateFilterType(value);
    onUpdateFilterId("");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <h2 className="text-[14px] font-semibold text-foreground">
          Pengaturan Rekap
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-[13px] text-foreground font-medium mb-2">
            Pilih Periode Laporan
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <Button
              type="button"
              variant={periodType === "academicYear" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect("academicYear")}
              className="text-[12px]"
            >
              Tahun Ajaran
            </Button>
            <Button
              type="button"
              variant={periodType === "semester" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect("semester")}
              className="text-[12px]"
            >
              Semester
            </Button>
            <Button
              type="button"
              variant={periodType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect("month")}
              className="text-[12px]"
            >
              Bulanan
            </Button>
            <Button
              type="button"
              variant={periodType === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect("custom")}
              className="text-[12px]"
            >
              Kustom
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {periodType !== "custom" && (
              <div>
                <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                  Tahun Ajaran
                </label>
                <Select
                  value={String(academicYearStart)}
                  onValueChange={(val) =>
                    onUpdateAcademicYearStart(Number(val))
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem
                        key={year.startYear}
                        value={String(year.startYear)}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === "semester" && (
              <div>
                <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                  Semester
                </label>
                <Select
                  value={semester}
                  onValueChange={(val) =>
                    onUpdateSemester(val as AcademicSemester)
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ganjil">Ganjil</SelectItem>
                    <SelectItem value="genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === "month" && (
              <div>
                <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                  Bulan
                </label>
                <Select
                  value={selectedMonth}
                  onValueChange={(val) => onUpdateSelectedMonth(val)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicMonthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {periodType === "custom" && (
            <div className="flex flex-col md:flex-row gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                  Dari
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onUpdateStartDate(e.target.value)}
                  className="ui-input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-muted-foreground font-medium mb-1">
                  Sampai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onUpdateEndDate(e.target.value)}
                  className="ui-input"
                />
              </div>
            </div>
          )}

          {startDate && endDate && (
            <div className="px-3 py-2 bg-[hsl(142_76%_97%)] rounded-md border border-[hsl(142_42%_82%)]">
              <p className="text-[12px] text-[hsl(142_72%_29%)] font-medium">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full">
            <label className="block text-[13px] text-foreground font-medium mb-1.5">
              Filter Laporan
            </label>
            <Select
              value={filterType}
              onValueChange={(val) => handleFilterTypeChange(val)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">
                  Semua {terms.studentSingularTitle}
                </SelectItem>
                <SelectItem value="jilid">
                  Berdasarkan {terms.levelSingularTitle}
                </SelectItem>
                <SelectItem value="guru">
                  Berdasarkan {terms.mentorSingularTitle}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType !== "semua" && (
            <div className="w-full">
              <label className="block text-[13px] text-foreground font-medium mb-1.5">
                Pilih{" "}
                {filterType === "jilid"
                  ? terms.levelSingularTitle
                  : terms.mentorSingularTitle}
              </label>
              <Select
                value={filterId}
                onValueChange={(val) => onUpdateFilterId(val)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Pilih spesifik..." />
                </SelectTrigger>
                <SelectContent>
                  {filterType === "jilid"
                    ? jilidList.map((jilid) => (
                        <SelectItem key={jilid.id} value={jilid.id}>
                          {jilid.nama}
                        </SelectItem>
                      ))
                    : guruList.map((guru) => (
                        <SelectItem key={guru.id} value={guru.id}>
                          {guru.nama}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full h-10"
          >
            {!isGenerating ? (
              <>
                <HugeiconsIcon
                  icon={FileDownloadIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={2}
                />
                Buat Rekap
              </>
            ) : (
              <span>Menyusun Data...</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportFilter;

