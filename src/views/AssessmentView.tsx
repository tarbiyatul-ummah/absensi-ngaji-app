import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import * as XLSX from "xlsx";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssessmentFormDialog } from "../components/assessment/AssessmentFormDialog";
import { AssessmentRadarChart } from "../components/assessment/AssessmentRadarChart";
import { AssessmentScoreDialog } from "../components/assessment/AssessmentScoreDialog";
import { ConfirmModal } from "../components/master/ConfirmModal";
import { Toast } from "../components/master/Toast";
import { useOrganizationConfig, useTerms } from "../config/organization";
import {
  addAssessment,
  deleteAssessment,
  getAssessments,
  saveAssessmentResult,
  updateAssessment,
} from "../services/assessmentService";
import type { AssessmentPdfProgress } from "../services/assessmentPdfReportService";
import { getAcademicYears } from "../services/academicYearService";
import { getAttendanceByDateRange } from "../services/attendanceService";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import type {
  AcademicYear,
  Assessment,
  AssessmentFormData,
  AssessmentResult,
  AssessmentScore,
  Attendance,
  Guru,
  Jilid,
  Santri,
} from "../types";
import {
  formatDateLong,
  getAcademicYearLabel,
  getAcademicYearOptions,
  getCurrentAcademicYearStart,
  getCurrentSemester,
  getSemesterRange,
} from "../utils/academicPeriod";
import type { AcademicSemester } from "../utils/academicPeriod";

interface AssessmentReportRow {
  santri: Santri;
  result: AssessmentResult;
  attendancePresent: number;
  attendancePermission: number;
  attendanceAbsent: number;
  attendanceRecorded: number;
}

export const AssessmentView: React.FC = () => {
  const { id: routeAssessmentId } = useParams<{ id: string }>();
  const isDetailPage = Boolean(routeAssessmentId);
  const navigate = useNavigate();
  const terms = useTerms();
  const organizationConfig = useOrganizationConfig();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [academicYearList, setAcademicYearList] = useState<AcademicYear[]>([]);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState(
    routeAssessmentId ?? ""
  );
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [selectedReportAcademicYearStart, setSelectedReportAcademicYearStart] =
    useState(getCurrentAcademicYearStart());
  const [selectedReportSemester, setSelectedReportSemester] =
    useState<AcademicSemester>(getCurrentSemester());
  const [reportRangeMode, setReportRangeMode] = useState<"semester" | "custom">(
    "semester"
  );

  const defaultRange = useMemo(
    () =>
      getSemesterRange(
        selectedReportAcademicYearStart,
        selectedReportSemester
      ),
    [selectedReportAcademicYearStart, selectedReportSemester]
  );

  const [reportStartDate, setReportStartDate] = useState(defaultRange.start);
  const [reportEndDate, setReportEndDate] = useState(defaultRange.end);
  const [reportRows, setReportRows] = useState<AssessmentReportRow[]>([]);
  const [isReportVisible, setIsReportVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  const [pdfProgress, setPdfProgress] = useState<AssessmentPdfProgress>({
    current: 0,
    total: 0,
    message: "",
  });
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    []
  );

  const formatAssessmentError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("assessment_type") ||
      lowerMessage.includes("minimum_score") ||
      lowerMessage.includes("schema cache")
    ) {
      return "Schema penilaian belum terbaru. Jalankan ulang supabase/assessment_schema.sql di Supabase, lalu refresh halaman.";
    }

    return message;
  };

  const sortedSantriList = useMemo(() => {
    return [...santriList].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [santriList]);

  const activeAssessmentId = isDetailPage
    ? routeAssessmentId
    : selectedAssessmentId;

  const selectedAssessment = useMemo(() => {
    return (
      assessments.find((a) => a.id === activeAssessmentId) ?? null
    );
  }, [assessments, activeAssessmentId]);

  const selectedParticipants = useMemo(() => {
    if (!selectedAssessment) return [];
    const participantIds = new Set(
      selectedAssessment.participants.map((p) => p.santriId)
    );
    return sortedSantriList.filter((s) => participantIds.has(s.id));
  }, [selectedAssessment, sortedSantriList]);

  const jilidMap = useMemo(
    () => new Map(jilidList.map((j) => [j.id, j.nama])),
    [jilidList]
  );

  const guruMap = useMemo(
    () => new Map(guruList.map((g) => [g.id, g.nama])),
    [guruList]
  );

  const getJilidName = useCallback(
    (jilidId: string) => jilidMap.get(jilidId) ?? "-",
    [jilidMap]
  );

  const getGuruName = useCallback(
    (guruId: string) => guruMap.get(guruId) ?? "-",
    [guruMap]
  );

  const filteredParticipants = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase();
    if (!keyword) return selectedParticipants;

    return selectedParticipants.filter((santri) =>
      [santri.nama, getJilidName(santri.jilidId), getGuruName(santri.guruId)]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [selectedParticipants, studentSearch, getJilidName, getGuruName]);

  const selectedSantri = useMemo(() => {
    return (
      selectedParticipants.find((santri) => santri.id === selectedSantriId) ??
      null
    );
  }, [selectedParticipants, selectedSantriId]);

  const selectedResult = useMemo(() => {
    if (!selectedAssessment || !selectedSantriId) return null;
    return (
      selectedAssessment.results.find((r) => r.santriId === selectedSantriId) ??
      null
    );
  }, [selectedAssessment, selectedSantriId]);

  const assessmentInitialValue = useMemo<AssessmentFormData | null>(() => {
    if (!selectedAssessment) return null;
    return {
      name: selectedAssessment.name,
      assessmentType: selectedAssessment.assessmentType,
      minimumScore: selectedAssessment.minimumScore,
      items: selectedAssessment.items.map((item) => ({
        id: item.id,
        label: item.label,
      })),
      santriIds: selectedAssessment.participants.map((p) => p.santriId),
    };
  }, [selectedAssessment]);

  const getSemesterLabel = (semester: AcademicSemester) =>
    semester === "ganjil" ? "Ganjil" : "Genap";

  const getResultCount = (assessment: Assessment) => assessment.results.length;

  const getResultBySantriId = useCallback(
    (santriId: string) =>
      selectedAssessment?.results.find((r) => r.santriId === santriId) ?? null,
    [selectedAssessment]
  );

  const reportAcademicYearOptions = useMemo(() => {
    if (academicYearList.length > 0) {
      return [...academicYearList]
        .sort((a, b) => b.startYear - a.startYear)
        .map((year) => ({
          startYear: year.startYear,
          label: getAcademicYearLabel(year.startYear),
        }));
    }
    return getAcademicYearOptions(selectedReportAcademicYearStart);
  }, [academicYearList, selectedReportAcademicYearStart]);

  const selectedReportRange = useMemo(() => {
    if (reportRangeMode === "custom") {
      return {
        start: reportStartDate,
        end: reportEndDate,
      };
    }
    return getSemesterRange(
      selectedReportAcademicYearStart,
      selectedReportSemester
    );
  }, [
    reportRangeMode,
    reportStartDate,
    reportEndDate,
    selectedReportAcademicYearStart,
    selectedReportSemester,
  ]);

  const reportDateRangeLabel = useMemo(
    () =>
      `${formatDateLong(selectedReportRange.start)} - ${formatDateLong(
        selectedReportRange.end
      )}`,
    [selectedReportRange]
  );

  const getAttendanceStatus = (attendance: Attendance) =>
    attendance.status ?? (attendance.isPresent ? "present" : "absent");

  const getScoresByItemId = (scores: AssessmentScore[]) =>
    new Map(scores.map((score) => [score.assessmentItemId, score.score]));

  const sanitizeFileName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const buildReportRows = async (): Promise<AssessmentReportRow[]> => {
    if (!selectedAssessment) return [];
    const range = selectedReportRange;

    if (range.start > range.end) {
      triggerToast(
        "Tanggal awal report tidak boleh melewati tanggal akhir.",
        "error"
      );
      return [];
    }

    const assessedResults = selectedAssessment.results.filter(
      (result) => result.scores.length > 0
    );

    if (assessedResults.length === 0) {
      triggerToast("Belum ada siswa yang sudah dinilai.", "error");
      return [];
    }

    const attendanceList = await getAttendanceByDateRange(range.start, range.end);
    const attendanceBySantri = attendanceList.reduce((acc, attendance) => {
      const current = acc.get(attendance.santriId) ?? {
        present: 0,
        permission: 0,
        absent: 0,
        recorded: 0,
      };
      const status = getAttendanceStatus(attendance);

      current.recorded += 1;
      if (status === "present") current.present += 1;
      if (status === "permission") current.permission += 1;
      if (status === "absent") current.absent += 1;
      acc.set(attendance.santriId, current);
      return acc;
    }, new Map<string, { present: number; permission: number; absent: number; recorded: number }>());

    const santriById = new Map(santriList.map((s) => [s.id, s]));

    const rows = assessedResults
      .map((result) => {
        const santri = santriById.get(result.santriId);
        if (!santri) return null;

        const attendance = attendanceBySantri.get(santri.id) ?? {
          present: 0,
          permission: 0,
          absent: 0,
          recorded: 0,
        };

        return {
          santri,
          result,
          attendancePresent: attendance.present,
          attendancePermission: attendance.permission,
          attendanceAbsent: attendance.absent,
          attendanceRecorded: attendance.recorded,
        };
      })
      .filter((row): row is AssessmentReportRow => Boolean(row))
      .sort((a, b) => a.santri.nama.localeCompare(b.santri.nama));

    if (rows.length === 0) {
      triggerToast(
        `Report belum bisa dibuat karena data ${terms.studentSingularLower} untuk hasil penilaian tidak ditemukan.`,
        "error"
      );
    }

    return rows;
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [santriRes, jilidRes, guruRes, academicYearRes, assessmentRes] =
        await Promise.all([
          getSantri(),
          getJilid(),
          getGuru(),
          getAcademicYears().catch(() => []),
          getAssessments(),
        ]);

      setSantriList(santriRes);
      setJilidList(jilidRes);
      setGuruList(guruRes);
      setAcademicYearList(academicYearRes);
      setAssessments(assessmentRes);

      const activeAcademicYear = academicYearRes.find((year) => year.isActive);
      if (activeAcademicYear) {
        setSelectedReportAcademicYearStart(activeAcademicYear.startYear);
      }

      if (routeAssessmentId) {
        setSelectedAssessmentId(routeAssessmentId);
      } else if (assessmentRes.length > 0) {
        setSelectedAssessmentId((prev) =>
          assessmentRes.some((a) => a.id === prev) ? prev : assessmentRes[0].id
        );
      }
    } catch (error) {
      console.error(error);
      triggerToast(
        formatAssessmentError(
          error,
          "Data penilaian belum bisa dimuat. Pastikan assessment_schema.sql terbaru sudah dijalankan."
        ),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [routeAssessmentId, triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click outside to close actions menu
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setIsAssessmentModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedAssessment) return;
    setIsActionsMenuOpen(false);
    setModalMode("edit");
    setIsAssessmentModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedAssessment) return;
    setIsActionsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleSaveAssessment = async (data: AssessmentFormData) => {
    setIsSaving(true);
    try {
      if (modalMode === "create") {
        const newId = await addAssessment(data);
        triggerToast("Penilaian berhasil dibuat.");
        setIsAssessmentModalOpen(false);
        await loadData();
        navigate(`/penilaian/${newId}`);
      } else if (selectedAssessment) {
        await updateAssessment(selectedAssessment.id, data);
        triggerToast("Penilaian berhasil diperbarui.");
        setIsAssessmentModalOpen(false);
        await loadData();
      }
    } catch (error) {
      console.error(error);
      triggerToast(
        formatAssessmentError(error, "Penilaian gagal disimpan."),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;

    setIsSaving(true);
    try {
      await deleteAssessment(selectedAssessment.id);
      setIsDeleteModalOpen(false);
      setSelectedAssessmentId("");
      navigate("/penilaian");
      await loadData();
      triggerToast("Penilaian berhasil dihapus.");
    } catch (error) {
      triggerToast("Penilaian gagal dihapus.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openScoreModal = (santriId: string) => {
    setSelectedSantriId(santriId);
    setIsScoreModalOpen(true);
  };

  const handleSaveResult = async (data: {
    notes: string;
    scores: Array<{ assessmentItemId: string; score: number }>;
  }) => {
    if (!selectedAssessment || !selectedSantriId) return;

    setIsSaving(true);
    try {
      await saveAssessmentResult({
        assessmentId: selectedAssessment.id,
        santriId: selectedSantriId,
        notes: data.notes,
        scores: data.scores,
      });
      await loadData();
      setIsScoreModalOpen(false);
      triggerToast("Nilai berhasil disimpan.");
    } catch (error) {
      triggerToast("Nilai gagal disimpan.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedAssessment) return;

    setIsSaving(true);
    try {
      const rows = await buildReportRows();
      if (rows.length === 0) return;

      const excelRows = rows.map((row) => {
        const scoreByItemId = getScoresByItemId(row.result.scores);

        return {
          [`Nama ${terms.studentSingularTitle}`]: row.santri.nama,
          [terms.levelSingularTitle]: getJilidName(row.santri.jilidId),
          [terms.mentorSingularTitle]: getGuruName(row.santri.guruId),
          Hadir: row.attendancePresent,
          Izin: row.attendancePermission,
          Alfa: row.attendanceAbsent,
          "Total Absensi Tercatat": row.attendanceRecorded,
          ...Object.fromEntries(
            selectedAssessment.items.map((item) => [
              item.label,
              scoreByItemId.get(item.id) ?? 0,
            ])
          ),
          Catatan: row.result.notes ?? "",
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      const fileName =
        sanitizeFileName(selectedAssessment.name) || "penilaian";

      XLSX.utils.book_append_sheet(workbook, worksheet, "Report Penilaian");
      XLSX.writeFile(workbook, `report-${fileName}.xlsx`);
      triggerToast("Report Excel berhasil dibuat.");
    } catch (error) {
      triggerToast("Report Excel gagal dibuat.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedAssessment) return;

    setIsPdfGenerating(true);
    setPdfProgress({
      current: 0,
      total: selectedAssessment.results.length,
      message: "Menyiapkan data report...",
    });
    try {
      const rows = await buildReportRows();
      if (rows.length === 0) return;

      const fileName =
        sanitizeFileName(selectedAssessment.name) || "penilaian";
      setPdfProgress({
        current: 0,
        total: rows.length,
        message: "Memuat generator PDF...",
      });
      const { generateAssessmentPdfReport } = await import(
        "../services/assessmentPdfReportService"
      );

      await generateAssessmentPdfReport(
        rows.map((row) => {
          const scoreByItemId = getScoresByItemId(row.result.scores);

          return {
            studentName: row.santri.nama,
            birthDateLabel: row.santri.tanggalLahir
              ? formatDateLong(row.santri.tanggalLahir)
              : "-",
            levelName: getJilidName(row.santri.jilidId),
            levelLabel: terms.levelSingularTitle,
            mentorName: getGuruName(row.santri.guruId),
            mentorLabel: terms.mentorSingularTitle,
            assessmentName: selectedAssessment.name,
            organizationName: organizationConfig.name,
            logoUrl: organizationConfig.faviconUrl,
            academicYearLabel: getAcademicYearLabel(
              selectedReportAcademicYearStart
            ),
            semesterLabel: getSemesterLabel(selectedReportSemester),
            minimumScore: selectedAssessment.minimumScore,
            attendancePresent: row.attendancePresent,
            attendancePermission: row.attendancePermission,
            attendanceAbsent: row.attendanceAbsent,
            scores: selectedAssessment.items.map((item) => ({
              label: item.label,
              score: scoreByItemId.get(item.id) ?? 0,
              maxScore: item.maxScore,
            })),
            notes: row.result.notes ?? "",
          };
        }),
        `report-${fileName}.pdf`,
        (progress) => {
          setPdfProgress(progress);
        }
      );
      triggerToast("Report PDF berhasil dibuat.");
    } catch (error) {
      console.error(error);
      triggerToast("Report PDF gagal dibuat.", "error");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="app-page">
      {toastMessage && (
        <Toast
          show={!!toastMessage}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="app-container-wide space-y-5">
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link
            to={isDetailPage ? "/penilaian" : "/dashboard"}
            className="flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.7} />
            {isDetailPage ? "Penilaian" : "Dashboard"}
          </Link>
        </Button>

        <header className="app-header">
          <div>
            <h1 className="app-title">Penilaian</h1>
            <p className="app-subtitle">
              Buat format penilaian, pilih {terms.studentSingularLower}, lalu
              isi nilai dan catatan perkembangan.
            </p>
          </div>
          {!isDetailPage && (
            <Button type="button" onClick={openCreateModal}>
              <HugeiconsIcon icon={PlusSignIcon} size={17} strokeWidth={2} />
              Add Penilaian
            </Button>
          )}
        </header>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : !isDetailPage ? (
          <main>
            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle>Daftar Penilaian</CardTitle>
                <CardDescription>
                  {assessments.length} penilaian aktif
                </CardDescription>
              </CardHeader>

              {assessments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {assessments.map((assessment) => (
                    <Link
                      key={assessment.id}
                      to={`/penilaian/${assessment.id}`}
                      className="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {assessment.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {assessment.items.length} butir
                        </Badge>
                        <Badge variant="secondary">
                          {getResultCount(assessment)}/
                          {assessment.participants.length} selesai
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Belum ada penilaian.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Klik Add Penilaian untuk membuat format pertama.
                  </p>
                </div>
              )}
            </Card>
          </main>
        ) : selectedAssessment ? (
          <main>
            <Card className="gap-0 py-0">
              <CardHeader className="no-print border-b py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{selectedAssessment.name}</CardTitle>
                    <CardDescription>
                      {selectedAssessment.participants.length}{" "}
                      {terms.studentSingularLower} - Nilai Minimum{" "}
                      {selectedAssessment.minimumScore}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isSaving ||
                        isPdfGenerating ||
                        selectedAssessment.results.length === 0
                      }
                      onClick={handleExportExcel}
                    >
                      <FileSpreadsheet className="h-4 w-4" strokeWidth={1.8} />
                      Export Excel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isSaving ||
                        isPdfGenerating ||
                        selectedAssessment.results.length === 0
                      }
                      onClick={handleGenerateReport}
                    >
                      <FileText className="h-4 w-4" strokeWidth={1.8} />
                      {isPdfGenerating
                        ? "Membuat PDF..."
                        : "Generate Report"}
                    </Button>
                    <div ref={actionsMenuRef} className="relative w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsActionsMenuOpen((prev) => !prev);
                        }}
                      >
                        <MoreVertical
                          className="h-4 w-4"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        Lainnya
                      </Button>

                      {isActionsMenuOpen && (
                        <div
                          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={openEditModal}
                          >
                            <Pencil
                              className="h-4 w-4"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            Edit Penilaian
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                            onClick={openDeleteModal}
                          >
                            <Trash2
                              className="h-4 w-4"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Periode Kehadiran Report
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reportDateRangeLabel}
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-auto">
                      <button
                        type="button"
                        className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
                          reportRangeMode === "semester"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setReportRangeMode("semester")}
                      >
                        Semester
                      </button>
                      <button
                        type="button"
                        className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
                          reportRangeMode === "custom"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setReportRangeMode("custom")}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {reportRangeMode === "semester" ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1.5 text-xs">Tahun Ajaran</Label>
                        <select
                          value={selectedReportAcademicYearStart}
                          onChange={(e) =>
                            setSelectedReportAcademicYearStart(
                              Number(e.target.value)
                            )
                          }
                          className="ui-select"
                        >
                          {reportAcademicYearOptions.map((year) => (
                            <option key={year.startYear} value={year.startYear}>
                              {year.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1.5 text-xs">Semester</Label>
                        <select
                          value={selectedReportSemester}
                          onChange={(e) =>
                            setSelectedReportSemester(
                              e.target.value as AcademicSemester
                            )
                          }
                          className="ui-select"
                        >
                          <option value="ganjil">Ganjil</option>
                          <option value="genap">Genap</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1.5 text-xs">
                          Awal Absensi Report
                        </Label>
                        <Input
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          type="date"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 text-xs">
                          Akhir Absensi Report
                        </Label>
                        <Input
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          type="date"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-4">
                <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    type="search"
                    placeholder={`Cari ${terms.studentSingularLower}...`}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">
                      {selectedAssessment.results.length}/
                      {selectedAssessment.participants.length} selesai
                    </Badge>
                  </div>
                </section>

                <section>
                  {filteredParticipants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredParticipants.map((santri) => {
                        const res = getResultBySantriId(santri.id);
                        return (
                          <button
                            key={santri.id}
                            type="button"
                            className="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
                            onClick={() => openScoreModal(santri.id)}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-foreground">
                                  {santri.nama}
                                </span>
                                <span className="mt-1 block truncate text-xs text-muted-foreground">
                                  {getJilidName(santri.jilidId)} -{" "}
                                  {getGuruName(santri.guruId)}
                                </span>
                              </span>
                              <Badge
                                variant={res ? "secondary" : "outline"}
                                className={`shrink-0 ${
                                  res
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : ""
                                }`}
                              >
                                {res ? "Selesai" : "Belum"}
                              </Badge>
                            </span>

                            <span className="mt-4 flex items-center justify-between gap-3">
                              <span className="text-xs text-muted-foreground">
                                {res
                                  ? "Klik untuk edit nilai"
                                  : "Klik untuk mulai menilai"}
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                {res ? "Edit Nilai" : "Nilai"}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground">
                      Tidak ada {terms.studentSingularLower} yang sesuai.
                    </div>
                  )}
                </section>
              </CardContent>
            </Card>
          </main>
        ) : (
          <main>
            <Card className="gap-0 py-0">
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-foreground">
                  Penilaian tidak ditemukan.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kembali ke daftar penilaian untuk memilih data yang tersedia.
                </p>
              </div>
            </Card>
          </main>
        )}

        <AssessmentScoreDialog
          open={isScoreModalOpen}
          onOpenChange={setIsScoreModalOpen}
          assessment={selectedAssessment}
          santri={selectedSantri}
          result={selectedResult}
          levelName={
            selectedSantri ? getJilidName(selectedSantri.jilidId) : "-"
          }
          mentorName={
            selectedSantri ? getGuruName(selectedSantri.guruId) : "-"
          }
          saving={isSaving}
          onSubmit={handleSaveResult}
          onValidationError={(message) => triggerToast(message, "error")}
        />

        <Dialog open={isPdfGenerating}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Membuat PDF Report</DialogTitle>
              <DialogDescription>
                {pdfProgress.message || "Menyiapkan report..."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{
                    width: `${
                      pdfProgress.total > 0
                        ? Math.round(
                            (pdfProgress.current / pdfProgress.total) * 100
                          )
                        : 8
                    }%`,
                  }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {pdfProgress.total > 0
                  ? `${pdfProgress.current}/${pdfProgress.total} halaman`
                  : "Memulai..."}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isReportVisible} onOpenChange={setIsReportVisible}>
          <DialogContent className="gap-0 p-0 sm:max-w-5xl">
            <DialogHeader className="no-print border-b px-5 py-4 text-left">
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle>Report Penilaian</DialogTitle>
                  <DialogDescription>
                    {selectedAssessment?.name} - Periode absensi:{" "}
                    {reportDateRangeLabel}
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handlePrintReport}
                >
                  <Printer className="h-4 w-4" strokeWidth={1.8} />
                  Print / Save PDF
                </Button>
              </div>
            </DialogHeader>

            {selectedAssessment && (
              <div className="assessment-report-print max-h-[78vh] space-y-4 overflow-y-auto p-5">
                {reportRows.map((row) => (
                  <article
                    key={row.result.id}
                    className="assessment-report-page space-y-4 rounded-lg border bg-background p-4"
                  >
                    <div className="space-y-3 border-b pb-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Report Penilaian
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-foreground">
                            {row.santri.nama}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getJilidName(row.santri.jilidId)} -{" "}
                            {getGuruName(row.santri.guruId)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {selectedAssessment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reportDateRangeLabel}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-muted px-3 py-2">
                          <p className="text-xs text-muted-foreground">Hadir</p>
                          <p className="text-xl font-semibold text-foreground">
                            {row.attendancePresent}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted px-3 py-2">
                          <p className="text-xs text-muted-foreground">Izin</p>
                          <p className="text-xl font-semibold text-foreground">
                            {row.attendancePermission}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted px-3 py-2">
                          <p className="text-xs text-muted-foreground">Alfa</p>
                          <p className="text-xl font-semibold text-foreground">
                            {row.attendanceAbsent}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Tercatat
                          </p>
                          <p className="text-xl font-semibold text-foreground">
                            {row.attendanceRecorded}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="assessment-report-body grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
                      <AssessmentRadarChart
                        items={selectedAssessment.items}
                        scores={row.result.scores}
                        minimumScore={selectedAssessment.minimumScore}
                      />

                      <div className="assessment-report-detail space-y-3">
                        <div className="overflow-hidden rounded-lg border">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-medium">Butir</th>
                                <th className="w-28 px-3 py-2 text-right font-medium">
                                  Nilai
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedAssessment.items.map((item) => (
                                <tr key={`${row.result.id}-${item.id}`}>
                                  <td className="px-3 py-2 text-foreground">
                                    {item.label}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                                    {getScoresByItemId(row.result.scores).get(
                                      item.id
                                    ) ?? 0}
                                    /{item.maxScore}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Catatan
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {row.result.notes ||
                              "Tidak ada catatan tambahan."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AssessmentFormDialog
        open={isAssessmentModalOpen}
        onOpenChange={setIsAssessmentModalOpen}
        title={modalMode === "create" ? "Add Penilaian" : "Edit Penilaian"}
        description={
          modalMode === "create"
            ? "Buat format penilaian dan pilih peserta."
            : "Perbarui format penilaian dan peserta."
        }
        submitText={modalMode === "create" ? "Selesai" : "Simpan Perubahan"}
        saving={isSaving}
        initialValue={modalMode === "edit" ? assessmentInitialValue : null}
        santriList={santriList}
        jilidList={jilidList}
        guruList={guruList}
        onSubmit={handleSaveAssessment}
        onValidationError={(message) => triggerToast(message, "error")}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Penilaian?"
        message={`Penilaian ${selectedAssessment?.name ?? ""} akan dihapus dari daftar aktif.`}
        confirmText={isSaving ? "Menghapus..." : "Hapus Penilaian"}
        onConfirm={handleDeleteAssessment}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default AssessmentView;
