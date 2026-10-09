import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { getSantri, getJilid, getGuru } from "../services/masterService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import {
  getAcademicYears,
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "../services/academicYearService";
import type { AcademicYear, Attendance, Santri, Jilid, Guru } from "../types";
import { ExportFilter } from "../components/export/ExportFilter";
import { ExportResult } from "../components/export/ExportResult";
import { Toast } from "../components/master/Toast";
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
import { useOrganizationConfig, useTerms } from "../config/organization";

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

export const ExportView: React.FC = () => {
  const terms = useTerms();
  const organizationConfig = useOrganizationConfig();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState<AcademicPeriodType>("semester");
  const [selectedAcademicYearStart, setSelectedAcademicYearStart] = useState(
    getCurrentAcademicYearStart()
  );
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester>(
    getCurrentSemester()
  );
  const [selectedMonth, setSelectedMonth] = useState(getCurrentAcademicMonth());
  const [filterType, setFilterType] = useState("semua"); // 'semua', 'jilid', 'guru'
  const [filterId, setFilterId] = useState("");
  const [exportReport, setExportReport] = useState<ExportReport | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [academicYearList, setAcademicYearList] = useState<AcademicYear[]>([]);

  const academicYearOptions = useMemo(
    () => getAcademicYearSelectOptions(academicYearList),
    [academicYearList]
  );

  const academicMonthOptions = useMemo(
    () => getAcademicMonthOptions(selectedAcademicYearStart),
    [selectedAcademicYearStart]
  );

  const syncDateRange = useCallback(
    (
      type: AcademicPeriodType,
      yearStart: number,
      sem: AcademicSemester,
      month: string
    ) => {
      if (type === "custom") return;

      const range = getAcademicPeriodRange(type, yearStart, sem, month);
      setStartDate(range.start);
      setEndDate(range.end);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [santriRes, jilidRes, guruRes, academicYearRes] =
          await Promise.all([
            getSantri(),
            getJilid(),
            getGuru(),
            getAcademicYears().catch(() => []),
          ]);

        if (!mounted) return;
        setSantriList(santriRes);
        setJilidList(jilidRes);
        setGuruList(guruRes);
        setAcademicYearList(academicYearRes);

        const defaultYear = getDefaultAcademicYearStart(academicYearRes);
        setSelectedAcademicYearStart(defaultYear);
        const months = getAcademicMonthOptions(defaultYear);
        const initialMonth = months[0]?.value ?? getCurrentAcademicMonth();
        setSelectedMonth(initialMonth);

        syncDateRange("semester", defaultYear, getCurrentSemester(), initialMonth);
      } catch (err) {
        console.error("Failed to load export master data", err);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [syncDateRange]);

  const handlePeriodTypeChange = (type: AcademicPeriodType) => {
    setPeriodType(type);
    syncDateRange(
      type,
      selectedAcademicYearStart,
      selectedSemester,
      selectedMonth
    );
  };

  const handleAcademicYearChange = (year: number) => {
    setSelectedAcademicYearStart(year);
    const months = getAcademicMonthOptions(year);
    const nextMonth = months[0]?.value ?? selectedMonth;
    setSelectedMonth(nextMonth);
    syncDateRange(periodType, year, selectedSemester, nextMonth);
  };

  const handleSemesterChange = (sem: AcademicSemester) => {
    setSelectedSemester(sem);
    syncDateRange(periodType, selectedAcademicYearStart, sem, selectedMonth);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    syncDateRange(periodType, selectedAcademicYearStart, selectedSemester, month);
  };

  const getReportPeriodLabel = () => {
    return getPeriodLabel(
      periodType,
      selectedAcademicYearStart,
      selectedSemester,
      selectedMonth,
      startDate,
      endDate
    );
  };

  const getFilterLabel = () => {
    if (filterType === "jilid") {
      const jilid = jilidList.find((item) => item.id === filterId);
      return `${terms.levelSingularTitle}: ${jilid?.nama ?? "-"}`;
    }

    if (filterType === "guru") {
      const guru = guruList.find((item) => item.id === filterId);
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
    if (!santri.createdAt) return startDate;

    const createdAtDate = new Date(santri.createdAt);
    if (Number.isNaN(createdAtDate.getTime())) return startDate;

    const createdAtKey = formatDateInput(createdAtDate);
    return createdAtKey > startDate ? createdAtKey : startDate;
  };

  const generateExport = async () => {
    if (!startDate || !endDate) {
      return triggerToast("Pilih periode terlebih dahulu.");
    }
    if (filterType !== "semua" && !filterId) {
      return triggerToast(
        `Pilih spesifik ${terms.levelSingularTitle}/${terms.mentorSingularTitle} terlebih dahulu.`
      );
    }

    setIsGenerating(true);

    try {
      const attendanceRows = await getAttendanceByDateRange(startDate, endDate);

      const attendanceBySantriAndDate: Record<
        string,
        Record<string, Attendance>
      > = {};
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

      let filteredSantri = santriList.filter((s) => s.isActive !== false);
      if (filterType === "jilid") {
        filteredSantri = filteredSantri.filter((s) => s.jilidId === filterId);
      } else if (filterType === "guru") {
        filteredSantri = filteredSantri.filter((s) => s.guruId === filterId);
      }
      filteredSantri.sort((a, b) => a.nama.localeCompare(b.nama));

      if (filteredSantri.length === 0) {
        setExportReport(null);
        triggerToast(
          `Tidak ada data ${terms.studentSingularLower} untuk filter tersebut.`
        );
        setIsGenerating(false);
        return;
      }

      const rows: ExportReportRow[] = filteredSantri.map((santri, index) => {
        const santriStartDate = getSantriStartDate(santri);
        const eligibleDates = sortedAttendanceDates.filter(
          (date) => date >= santriStartDate
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
          { hadir: 0, izin: 0, alfa: 0 }
        );
        const jilid = jilidList.find((item) => item.id === santri.jilidId);
        const guru = guruList.find((item) => item.id === santri.guruId);

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

      setExportReport({
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
      });
    } catch (error) {
      console.error(error);
      triggerToast("Terjadi kesalahan saat menarik data.");
    } finally {
      setIsGenerating(false);
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
    if (!exportReport) return;

    const report = exportReport;
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
      `
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
    if (!exportReport) return;

    const report = exportReport;
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
    link.download = `rekap-kehadiran-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-24 font-sans">
      <header className="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-[#202223]">Export Rekap PDF</h1>
      </header>

      {toastMessage && (
        <Toast
          show={!!toastMessage}
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="px-4 space-y-6 max-w-3xl mx-auto">
        <ExportFilter
          startDate={startDate}
          endDate={endDate}
          periodType={periodType}
          academicYearStart={selectedAcademicYearStart}
          semester={selectedSemester}
          selectedMonth={selectedMonth}
          academicYearOptions={academicYearOptions}
          academicMonthOptions={academicMonthOptions}
          filterType={filterType}
          filterId={filterId}
          jilidList={jilidList}
          guruList={guruList}
          isGenerating={isGenerating}
          onUpdateStartDate={setStartDate}
          onUpdateEndDate={setEndDate}
          onUpdatePeriodType={handlePeriodTypeChange}
          onUpdateAcademicYearStart={handleAcademicYearChange}
          onUpdateSemester={handleSemesterChange}
          onUpdateSelectedMonth={handleMonthChange}
          onUpdateFilterType={setFilterType}
          onUpdateFilterId={setFilterId}
          onGenerate={generateExport}
        />

        <AnimatePresence>
          {exportReport && (
            <ExportResult
              report={exportReport}
              onExportPdf={printPdf}
              onExportCsv={exportCsv}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExportView;

