import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Guru, Jilid, SantriType } from "@/types";
import { useTerms } from "@/config/organization";

export interface ImportRow {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
  isActive: boolean;
}

export interface SantriImportDialogProps {
  open: boolean;
  jilidList: Jilid[];
  guruList: Guru[];
  tipeList: SantriType[];
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ImportRow[]) => void;
}

export const SantriImportDialog: React.FC<SantriImportDialogProps> = ({
  open,
  jilidList,
  guruList,
  tipeList,
  onOpenChange,
  onImport,
}) => {
  const terms = useTerms();
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreviewRows([]);
      setErrors([]);
    }
  }, [open]);

  const normalized = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const buildLookup = <T extends { id: string; nama: string }>(items: T[]) =>
    new Map(items.map((item) => [normalized(item.nama), item.id]));

  const getCellValue = (
    row: Record<string, unknown>,
    aliases: string[],
  ): string => {
    const entry = Object.entries(row).find(([key]) =>
      aliases.includes(normalized(key)),
    );
    return String(entry?.[1] ?? "").trim();
  };

  const getRawCellValue = (
    row: Record<string, unknown>,
    aliases: string[],
  ): unknown => {
    const entry = Object.entries(row).find(([key]) =>
      aliases.includes(normalized(key)),
    );
    return entry?.[1];
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeBirthDate = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "";

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return formatDateKey(value);
    }

    if (typeof value === "number") {
      const parsedDate = XLSX.SSF.parse_date_code(value);
      if (!parsedDate) return "";

      return `${parsedDate.y}-${String(parsedDate.m).padStart(2, "0")}-${String(
        parsedDate.d,
      ).padStart(2, "0")}`;
    }

    const text = String(value).trim();
    const normalizedText = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (normalizedText) return text;

    const indonesianText = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (indonesianText) {
      const [, day, month, year] = indonesianText;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return "";
  };

  const isValidDateKey = (value: string) => {
    if (!value) return true;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && formatDateKey(date) === value;
  };

  const normalizeStatus = (value: unknown): boolean | null => {
    const text = normalized(value);
    if (!text) return true;
    if (["aktif", "active", "ya", "yes", "true", "1"].includes(text)) {
      return true;
    }
    if (
      ["nonaktif", "non aktif", "inactive", "tidak", "no", "false", "0"].includes(
        text,
      )
    ) {
      return false;
    }
    return null;
  };

  const parseFile = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "xlsx" || extension === "xls") {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
      });
    }
    throw new Error("Format file harus .xlsx atau .xls.");
  };

  const validateRows = (rawRows: Record<string, unknown>[]) => {
    const jilidByName = buildLookup(jilidList);
    const guruByName = buildLookup(guruList);
    const tipeByName = buildLookup(tipeList);
    const nextRows: ImportRow[] = [];
    const nextErrors: string[] = [];

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const nama = getCellValue(row, [
        "nama santri",
        `nama ${normalized(terms.studentSingularTitle)}`,
        "nama",
      ]);
      const jilidName = getCellValue(row, [
        normalized(terms.levelSingularTitle),
        "jilid",
        "level",
      ]);
      const guruName = getCellValue(row, [
        normalized(terms.mentorSingularTitle),
        "guru",
        "pengajar",
      ]);
      const tipeName = getCellValue(row, [
        "tipe santri",
        `tipe ${normalized(terms.studentSingularTitle)}`,
        "tipe",
        "jenis",
      ]);
      const tanggalLahir = normalizeBirthDate(
        getRawCellValue(row, [
          "tanggal lahir",
          "tgl lahir",
          "tanggal_lahir",
          "birth date",
        ]),
      );
      const rawStatus = getRawCellValue(row, ["status", "aktif", "is active"]);
      const isActive = normalizeStatus(rawStatus);

      const jilidId = jilidByName.get(normalized(jilidName));
      const guruId = guruByName.get(normalized(guruName));
      const tipeId = tipeName ? tipeByName.get(normalized(tipeName)) : undefined;

      if (!nama) nextErrors.push(`Baris ${rowNumber}: nama kosong.`);
      if (!jilidId)
        nextErrors.push(
          `Baris ${rowNumber}: ${terms.levelSingularTitle} "${jilidName}" tidak ditemukan.`,
        );
      if (!guruId)
        nextErrors.push(
          `Baris ${rowNumber}: ${terms.mentorSingularTitle} "${guruName}" tidak ditemukan.`,
        );
      if (tipeName && !tipeId)
        nextErrors.push(
          `Baris ${rowNumber}: tipe santri "${tipeName}" tidak ditemukan.`,
        );
      if (
        getRawCellValue(row, ["tanggal lahir", "tgl lahir", "tanggal_lahir"]) &&
        !tanggalLahir
      )
        nextErrors.push(
          `Baris ${rowNumber}: tanggal lahir harus berformat YYYY-MM-DD atau DD/MM/YYYY.`,
        );
      if (!isValidDateKey(tanggalLahir))
        nextErrors.push(`Baris ${rowNumber}: tanggal lahir tidak valid.`);
      if (isActive === null) {
        nextErrors.push(`Baris ${rowNumber}: status harus Aktif atau Nonaktif.`);
      }

      if (
        nama &&
        jilidId &&
        guruId &&
        (!tipeName || tipeId) &&
        isValidDateKey(tanggalLahir) &&
        isActive !== null
      ) {
        nextRows.push({
          nama,
          jilidId,
          guruId,
          tipeId,
          tanggalLahir: tanggalLahir || undefined,
          isActive,
        });
      }
    });

    setPreviewRows(nextRows);
    setErrors(nextErrors.slice(0, 12));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setPreviewRows([]);
    setErrors([]);
    if (!file) return;

    setIsParsing(true);
    try {
      const rows = await parseFile(file);
      validateRows(rows);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "File gagal dibaca.",
      ]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (previewRows.length === 0 || errors.length > 0) return;
    onImport(previewRows);
  };

  const canImport = previewRows.length > 0 && errors.length === 0;

  const downloadTemplate = () => {
    const rows = [
      {
        "Nama Santri": "Ahmad",
        [terms.levelSingularTitle]: jilidList[0]?.nama ?? "Jilid 1",
        [terms.mentorSingularTitle]: guruList[0]?.nama ?? "Ustadz A",
        "Tipe Santri": tipeList[0]?.nama ?? "Reguler",
        "Tanggal Lahir": "2015-01-20",
        Status: "Aktif",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template-import-santri.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import {terms.studentSingularTitle}</DialogTitle>
          <DialogDescription>
            Upload file Excel sesuai template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              Download Template Excel
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-excel-file">File</Label>
            <input
              id="import-excel-file"
              type="file"
              accept=".xlsx,.xls"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={handleFileChange}
            />
          </div>

          {isParsing && (
            <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
              Membaca file...
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="mb-2 font-medium">Periksa data import:</p>
              <ul className="list-disc space-y-1 pl-5">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
              {previewRows.length} {terms.studentSingularLower} siap diimport.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="button" disabled={!canImport} onClick={handleImport}>
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SantriImportDialog;

