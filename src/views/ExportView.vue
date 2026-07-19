<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import {
  getAcademicYears,
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "../services/academicYearService";
import type { AcademicYear, Attendance, Santri, Jilid, Guru } from "../types";
import ExportFilter from "../components/export/ExportFilter.vue";
import ExportResult from "../components/export/ExportResult.vue";
import Toast from "../components/master/Toast.vue";
import {
  type AcademicPeriodType,
  type AcademicSemester,
  formatDateInput,
  getAcademicMonthOptions,
  getAcademicPeriodRange,
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
  getCurrentSemester,
  getPeriodLabel,
} from "../utils/academicPeriod";
import { organizationConfig, terms } from "../config/organization";

interface ExportReportRow {
  no: number;
  nama: string;
  jilid: string;
  guru: string;
  hadir: number;
  izin: number;
  alfa: number;
}

interface ExportReport {
  title: string;
  periodLabel: string;
  filterLabel: string;
  generatedAt: string;
  rows: ExportReportRow[];
  totalKehadiran: number;
  totalIzin: number;
  totalAlfa: number;
}

const startDate = ref("");
const endDate = ref("");
const periodType = ref<AcademicPeriodType>("semester");
const selectedAcademicYearStart = ref(getCurrentAcademicYearStart());
const selectedSemester = ref<AcademicSemester>(getCurrentSemester());
const selectedMonth = ref(getCurrentAcademicMonth());
const filterType = ref("semua"); // 'semua', 'jilid', 'guru'
const filterId = ref("");
const exportReport = ref<ExportReport | null>(null);

// Toast state
const showToast = ref(false);
const toastMessage = ref("");

const triggerToast = (message: string) => {
  toastMessage.value = message;
  showToast.value = true;
};

const isGenerating = ref(false);

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const academicYearList = ref<AcademicYear[]>([]);

const academicYearOptions = computed(() =>
  getAcademicYearSelectOptions(academicYearList.value),
);

const academicMonthOptions = computed(() =>
  getAcademicMonthOptions(selectedAcademicYearStart.value),
);

const syncDateRange = () => {
  if (periodType.value === "custom") return;

  const range = getAcademicPeriodRange(
    periodType.value,
    selectedAcademicYearStart.value,
    selectedSemester.value,
    selectedMonth.value,
  );
  startDate.value = range.start;
  endDate.value = range.end;
};

onMounted(async () => {
  const [santriRes, jilidRes, guruRes, academicYearRes] = await Promise.all([
    getSantri(),
    getJilid(),
    getGuru(),
    getAcademicYears().catch(() => []),
  ]);

  santriList.value = santriRes;
  jilidList.value = jilidRes;
  guruList.value = guruRes;
  academicYearList.value = academicYearRes;
  selectedAcademicYearStart.value =
    getDefaultAcademicYearStart(academicYearRes);
  selectedMonth.value =
    getAcademicMonthOptions(selectedAcademicYearStart.value)[0]?.value ??
    selectedMonth.value;
  syncDateRange();
});

const handlePeriodTypeChange = (type: AcademicPeriodType) => {
  periodType.value = type;
  syncDateRange();
};

const handleAcademicYearChange = (value: number) => {
  selectedAcademicYearStart.value = value;
  const monthOptions = getAcademicMonthOptions(value);
  selectedMonth.value = monthOptions[0]?.value ?? selectedMonth.value;
  syncDateRange();
};

const handleSemesterChange = (value: AcademicSemester) => {
  selectedSemester.value = value;
  syncDateRange();
};

const handleMonthChange = (value: string) => {
  selectedMonth.value = value;
  syncDateRange();
};

const getReportPeriodLabel = () => {
  return getPeriodLabel(
    periodType.value,
    selectedAcademicYearStart.value,
    selectedSemester.value,
    selectedMonth.value,
    startDate.value,
    endDate.value,
  );
};

const getFilterLabel = () => {
  if (filterType.value === "jilid") {
    const jilid = jilidList.value.find((item) => item.id === filterId.value);
    return `${terms.levelSingularTitle}: ${jilid?.nama ?? "-"}`;
  }

  if (filterType.value === "guru") {
    const guru = guruList.value.find((item) => item.id === filterId.value);
    return `${terms.mentorSingularTitle}: ${guru?.nama ?? "-"}`;
  }

  return `Semua ${terms.studentSingularTitle}`;
};

const isAttendancePresent = (attendance: Attendance) => {
  const status =
    attendance.status ?? (attendance.isPresent ? "present" : "absent");
  return status === "present";
};

const isAttendancePermission = (attendance: Attendance) =>
  attendance.status === "permission";

const getSantriStartDate = (santri: Santri) => {
  if (!santri.createdAt) return startDate.value;

  const createdAtDate = new Date(santri.createdAt);
  if (Number.isNaN(createdAtDate.getTime())) return startDate.value;

  const createdAtKey = formatDateInput(createdAtDate);
  return createdAtKey > startDate.value ? createdAtKey : startDate.value;
};

const generateExport = async () => {
  if (!startDate.value || !endDate.value)
    return triggerToast("Pilih periode terlebih dahulu.");
  if (filterType.value !== "semua" && !filterId.value)
    return triggerToast(
      `Pilih spesifik ${terms.levelSingularTitle}/${terms.mentorSingularTitle} terlebih dahulu.`,
    );

  isGenerating.value = true;

  try {
    // 1. Ambil semua absensi di periode tersebut.
    const attendanceRows = await getAttendanceByDateRange(
      startDate.value,
      endDate.value,
    );

    const attendanceBySantriAndDate: Record<string, Record<string, Attendance>> =
      {};
    const attendanceDates = new Set<string>();

    attendanceRows.forEach((data) => {
      if (!data.santriId || !data.date) return;

      attendanceDates.add(data.date);
      if (!attendanceBySantriAndDate[data.santriId]) {
        attendanceBySantriAndDate[data.santriId] = {};
      }
      attendanceBySantriAndDate[data.santriId][data.date] = data;
    });

    const sortedAttendanceDates = [...attendanceDates].sort();

    // 2. Filter Santri Aktif sesuai pilihan (Semua / Jilid / Guru)
    let filteredSantri = santriList.value.filter((s) => s.isActive !== false);
    if (filterType.value === "jilid") {
      filteredSantri = filteredSantri.filter(
        (s) => s.jilidId === filterId.value,
      );
    } else if (filterType.value === "guru") {
      filteredSantri = filteredSantri.filter(
        (s) => s.guruId === filterId.value,
      );
    }
    filteredSantri.sort((a, b) => a.nama.localeCompare(b.nama));

    if (filteredSantri.length === 0) {
      exportReport.value = null;
      triggerToast(
        `Tidak ada data ${terms.studentSingularLower} untuk filter tersebut.`,
      );
      isGenerating.value = false;
      return;
    }

    // 3. Susun data laporan PDF
    const rows = filteredSantri.map((santri, index) => {
      const santriStartDate = getSantriStartDate(santri);
      const eligibleDates = sortedAttendanceDates.filter(
        (date) => date >= santriStartDate,
      );
      const stats = eligibleDates.reduce(
        (acc, date) => {
          const attendance = attendanceBySantriAndDate[santri.id]?.[date];

          if (attendance && isAttendancePresent(attendance)) {
            acc.hadir += 1;
          } else if (attendance && isAttendancePermission(attendance)) {
            acc.izin += 1;
          } else {
            acc.alfa += 1;
          }

          return acc;
        },
        { hadir: 0, izin: 0, alfa: 0 },
      );
      const jilid = jilidList.value.find((item) => item.id === santri.jilidId);
      const guru = guruList.value.find((item) => item.id === santri.guruId);

      return {
        no: index + 1,
        nama: santri.nama,
        jilid: jilid?.nama ?? "-",
        guru: guru?.nama ?? "-",
        hadir: stats.hadir,
        izin: stats.izin,
        alfa: stats.alfa,
      };
    });

    exportReport.value = {
      title: `Rekap Kehadiran ${terms.studentSingularTitle}`,
      periodLabel: getReportPeriodLabel(),
      filterLabel: getFilterLabel(),
      generatedAt: new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rows,
      totalKehadiran: rows.reduce((total, row) => total + row.hadir, 0),
      totalIzin: rows.reduce((total, row) => total + row.izin, 0),
      totalAlfa: rows.reduce((total, row) => total + row.alfa, 0),
    };
  } catch (error) {
    console.error(error);
    triggerToast("Terjadi kesalahan saat menarik data.");
  } finally {
    isGenerating.value = false;
  }
};

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const printPdf = () => {
  if (!exportReport.value) return;

  const report = exportReport.value;
  const rowsHtml = report.rows
    .map(
      (row) => `
        <tr>
          <td class="number">${escapeHtml(row.no)}</td>
          <td>${escapeHtml(row.nama)}</td>
          <td>${escapeHtml(row.jilid)}</td>
          <td>${escapeHtml(row.guru)}</td>
          <td class="number">${escapeHtml(row.hadir)}</td>
          <td class="number">${escapeHtml(row.izin)}</td>
          <td class="number">${escapeHtml(row.alfa)}</td>
        </tr>
      `,
    )
    .join("");

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    triggerToast("Popup diblokir. Izinkan popup untuk membuat PDF.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(report.title)}</title>
        <style>
          @page {
            size: A4;
            margin: 16mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #202223;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
          }

          header {
            border-bottom: 2px solid #202223;
            margin-bottom: 18px;
            padding-bottom: 12px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 22px;
            letter-spacing: 0;
          }

          .meta {
            display: grid;
            gap: 4px;
            color: #454749;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }

          .summary-item {
            border: 1px solid #d2d5d8;
            border-radius: 6px;
            padding: 10px;
          }

          .summary-label {
            margin: 0 0 4px;
            color: #6d7175;
            font-size: 11px;
          }

          .summary-value {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #d2d5d8;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f4f6f8;
            font-weight: 700;
          }

          .number {
            text-align: right;
            width: 54px;
          }

          footer {
            margin-top: 18px;
            color: #6d7175;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(report.title)}</h1>
          <div class="meta">
            <div>${escapeHtml(organizationConfig.name)}</div>
            <div>Periode: ${escapeHtml(report.periodLabel)}</div>
            <div>Filter: ${escapeHtml(report.filterLabel)}</div>
            <div>Dibuat: ${escapeHtml(report.generatedAt)}</div>
          </div>
        </header>

        <section class="summary" aria-label="Ringkasan laporan">
          <div class="summary-item">
            <p class="summary-label">Total ${escapeHtml(terms.studentSingularTitle)}</p>
            <p class="summary-value">${escapeHtml(report.rows.length)}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Total Kehadiran</p>
            <p class="summary-value">${escapeHtml(report.totalKehadiran)}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Total Izin</p>
            <p class="summary-value">${escapeHtml(report.totalIzin)}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">Total Alfa</p>
            <p class="summary-value">${escapeHtml(report.totalAlfa)}</p>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th class="number">No</th>
              <th>Nama ${escapeHtml(terms.studentSingularTitle)}</th>
              <th>${escapeHtml(terms.levelSingularTitle)}</th>
              <th>${escapeHtml(terms.mentorSingularTitle)}</th>
              <th class="number">Hadir</th>
              <th class="number">Izin</th>
              <th class="number">Alfa</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <footer>
          Dimohon untuk ${escapeHtml(terms.studentSingularLower)} yang kehadirannya masih di bawah target, agar terus ditingkatkan kehadirannya.
        </footer>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const csvValue = (value: string | number) => {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
};

const exportCsv = () => {
  if (!exportReport.value) return;

  const report = exportReport.value;
  const headers = [
    "No",
    `Nama ${terms.studentSingularTitle}`,
    terms.levelSingularTitle,
    terms.mentorSingularTitle,
    "Hadir",
    "Izin",
    "Alfa",
  ];
  const rows = report.rows.map((row) => [
    row.no,
    row.nama,
    row.jilid,
    row.guru,
    row.hadir,
    row.izin,
    row.alfa,
  ]);
  const csv = [
    ["Judul", report.title],
    ["Periode", report.periodLabel],
    ["Filter", report.filterLabel],
    ["Dibuat", report.generatedAt],
    [],
    headers,
    ...rows,
  ]
    .map((row) => row.map(csvValue).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rekap-kehadiran-${startDate.value}-${endDate.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="pb-24 font-sans">
    <!-- Header Shopify Style -->
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <h1 class="text-[20px] font-bold text-[#202223]">Export Rekap PDF</h1>
    </header>

    <!-- Toast Component -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      @close="showToast = false"
    />

    <div class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Filter Component -->
      <ExportFilter
        :start-date="startDate"
        :end-date="endDate"
        :period-type="periodType"
        :academic-year-start="selectedAcademicYearStart"
        :semester="selectedSemester"
        :selected-month="selectedMonth"
        :academic-year-options="academicYearOptions"
        :academic-month-options="academicMonthOptions"
        :filter-type="filterType"
        :filter-id="filterId"
        :jilid-list="jilidList"
        :guru-list="guruList"
        :is-generating="isGenerating"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
        @update:period-type="handlePeriodTypeChange"
        @update:academic-year-start="handleAcademicYearChange"
        @update:semester="handleSemesterChange"
        @update:selected-month="handleMonthChange"
        @update:filter-type="filterType = $event"
        @update:filter-id="filterId = $event"
        @generate="generateExport"
      />

      <!-- Result Component -->
      <ExportResult
        :report="exportReport"
        @export-pdf="printPdf"
        @export-csv="exportCsv"
      />
    </div>
  </div>
</template>
