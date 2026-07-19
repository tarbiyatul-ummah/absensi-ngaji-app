<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
import type { Guru, Jilid, SantriType } from "../../types";
import { terms } from "../../config/organization";

interface ImportRow {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
  isActive: boolean;
}

const props = defineProps<{
  open: boolean;
  jilidList: Jilid[];
  guruList: Guru[];
  tipeList: SantriType[];
}>();

const emit = defineEmits<{
  (e: "update:open", open: boolean): void;
  (e: "import", rows: ImportRow[]): void;
}>();

const previewRows = ref<ImportRow[]>([]);
const errors = ref<string[]>([]);
const isParsing = ref(false);

const normalized = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const buildLookup = <T extends { id: string; nama: string }>(items: T[]) =>
  new Map(items.map((item) => [normalized(item.nama), item.id]));

const getCellValue = (row: Record<string, unknown>, aliases: string[]) => {
  const entry = Object.entries(row).find(([key]) =>
    aliases.includes(normalized(key)),
  );

  return String(entry?.[1] ?? "").trim();
};

const getRawCellValue = (row: Record<string, unknown>, aliases: string[]) => {
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

const normalizeBirthDate = (value: unknown) => {
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

const normalizeStatus = (value: unknown) => {
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
  const jilidByName = buildLookup(props.jilidList);
  const guruByName = buildLookup(props.guruList);
  const tipeByName = buildLookup(props.tipeList);
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
    if (getRawCellValue(row, ["tanggal lahir", "tgl lahir", "tanggal_lahir"]) && !tanggalLahir)
      nextErrors.push(
        `Baris ${rowNumber}: tanggal lahir harus berformat YYYY-MM-DD atau DD/MM/YYYY.`,
      );
    if (!isValidDateKey(tanggalLahir))
      nextErrors.push(`Baris ${rowNumber}: tanggal lahir tidak valid.`);
    if (isActive === null) {
      nextErrors.push(
        `Baris ${rowNumber}: status harus Aktif atau Nonaktif.`,
      );
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

  previewRows.value = nextRows;
  errors.value = nextErrors.slice(0, 12);
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;

  previewRows.value = [];
  errors.value = [];
  if (!file) return;

  isParsing.value = true;

  try {
    const rows = await parseFile(file);
    validateRows(rows);
  } catch (error) {
    errors.value = [
      error instanceof Error ? error.message : "File gagal dibaca.",
    ];
  } finally {
    isParsing.value = false;
  }
};

const handleImport = () => {
  if (previewRows.value.length === 0 || errors.value.length > 0) return;
  emit("import", previewRows.value);
};

const canImport = computed(
  () => previewRows.value.length > 0 && errors.value.length === 0,
);

const downloadTemplate = () => {
  const rows = [
    {
      "Nama Santri": "Ahmad",
      [terms.levelSingularTitle]: props.jilidList[0]?.nama ?? "Jilid 1",
      [terms.mentorSingularTitle]: props.guruList[0]?.nama ?? "Ustadz A",
      "Tipe Santri": props.tipeList[0]?.nama ?? "Reguler",
      "Tanggal Lahir": "2015-01-20",
      Status: "Aktif",
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "template-import-santri.xlsx");
};

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      previewRows.value = [];
      errors.value = [];
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Import {{ terms.studentSingularTitle }}</DialogTitle>
        <DialogDescription>
          Upload file Excel sesuai template.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="outline" @click="downloadTemplate">
            Download Template Excel
          </Button>
        </div>

        <div class="space-y-2">
          <Label>File</Label>
          <input
            type="file"
            accept=".xlsx,.xls"
            class="block w-full rounded-md border border-[#C9CCCF] bg-white px-3 py-2 text-sm"
            @change="handleFileChange"
          />
        </div>

        <div
          v-if="isParsing"
          class="rounded-md border border-[#D5D9DD] bg-[#F9FAFB] p-3 text-sm text-[#6D7175]"
        >
          Membaca file...
        </div>

        <div
          v-if="errors.length > 0"
          class="rounded-md border border-[#FED3D1] bg-[#FFF4F4] p-3 text-sm text-[#D82C0D]"
        >
          <p class="mb-2 font-medium">Periksa data import:</p>
          <ul class="list-disc space-y-1 pl-5">
            <li v-for="error in errors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div
          v-if="previewRows.length > 0"
          class="rounded-md border border-[#D5D9DD] bg-[#F9FAFB] p-3 text-sm text-[#202223]"
        >
          {{ previewRows.length }} {{ terms.studentSingularLower }} siap
          diimport.
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          @click="emit('update:open', false)"
        >
          Batal
        </Button>
        <Button
          type="button"
          :disabled="!canImport"
          @click="handleImport"
        >
          Import Data
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
