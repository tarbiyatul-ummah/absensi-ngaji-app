import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import * as XLSX from "xlsx";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  FileSpreadsheet,
  FileText,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  springSnappy,
  useSmoothMotion,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";
import {
  getQualitativeGrade,
  getQualitativeLabel,
} from "@/utils/assessmentUtils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { LoadingState } from "@/components/ui/loading-state";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
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
  const { shouldReduceMotion } = useSmoothMotion();

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

  // Dua Tab Utama: "daily" (Penilaian Harian) dan "list" (Semua Penilaian)
  const [activeTab, setActiveTab] = useState<"daily" | "list">("daily");
  const [createIsDaily, setCreateIsDaily] = useState(false);

  const dailyAssessmentsList = useMemo(
    () => assessments.filter((a) => a.isDaily),
    [assessments]
  );

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
      return "Schema penilaian belum terbaru. Jalankan skrip assessment_schema.sql di Supabase, lalu refresh halaman.";
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

    return selectedParticipants.filter(
      (santri) =>
        santri.nama.toLowerCase().includes(keyword) ||
        getJilidName(santri.jilidId).toLowerCase().includes(keyword) ||
        getGuruName(santri.guruId)
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

  const currentParticipantIndex = useMemo(() => {
    if (!selectedSantriId) return -1;
    return filteredParticipants.findIndex((s) => s.id === selectedSantriId);
  }, [filteredParticipants, selectedSantriId]);

  const hasNextParticipant =
    currentParticipantIndex >= 0 &&
    currentParticipantIndex < filteredParticipants.length - 1;

  const selectedResult = useMemo(() => {
    if (!selectedAssessment || !selectedSantriId) return null;
    return (
      selectedAssessment.results.find((r) => r.santriId === selectedSantriId) ??
      null
    );
  }, [selectedAssessment, selectedSantriId]);

  const assessmentInitialValue = useMemo<AssessmentFormData | null>(() => {
    if (modalMode === "create") {
      return {
        name: "",
        assessmentType: "qualitative",
        minimumScore: 3,
        isDaily: createIsDaily,
        items: [{ label: "" }],
        santriIds: santriList.filter((s) => s.isActive !== false).map((s) => s.id),
      };
    }
    if (!selectedAssessment) return null;
    return {
      name: selectedAssessment.name,
      assessmentType: selectedAssessment.assessmentType,
      minimumScore: selectedAssessment.minimumScore,
      isDaily: Boolean(selectedAssessment.isDaily),
      items: selectedAssessment.items.map((item) => ({
        id: item.id,
        label: item.label,
      })),
      santriIds: selectedAssessment.participants.map((p) => p.santriId),
    };
  }, [modalMode, createIsDaily, selectedAssessment, santriList]);

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
    if (reportRangeMode === "semester") {
      return getSemesterRange(
        selectedReportAcademicYearStart,
        selectedReportSemester
      );
    }

    return {
      start: reportStartDate,
      end: reportEndDate,
    };
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
      };

      const status = getAttendanceStatus(attendance);
      if (status === "present") current.present += 1;
      if (status === "permission") current.permission += 1;
      if (status === "absent") current.absent += 1;

      acc.set(attendance.santriId, current);
      return acc;
    }, new Map<string, { present: number; permission: number; absent: number }>());

    const rows: AssessmentReportRow[] = assessedResults
      .map((result) => {
        const santri = sortedSantriList.find((s) => s.id === result.santriId);
        if (!santri) return null;

        const attendance = attendanceBySantri.get(santri.id) ?? {
          present: 0,
          permission: 0,
          absent: 0,
        };

        const totalRecorded =
          attendance.present + attendance.permission + attendance.absent;

        return {
          santri,
          result,
          attendancePresent: attendance.present,
          attendancePermission: attendance.permission,
          attendanceAbsent: attendance.absent,
          attendanceRecorded: totalRecorded,
        };
      })
      .filter((row): row is AssessmentReportRow => row !== null);

    if (rows.length === 0) {
      triggerToast(
        "Tidak ada data santri yang cocok untuk dicetak.",
        "error"
      );
      return [];
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
          "Data penilaian belum bisa dimuat. Pastikan skrip migrasi database sudah dijalankan."
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

  const openCreateModal = (isDaily = false) => {
    setModalMode("create");
    setCreateIsDaily(isDaily);
    setIsAssessmentModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedAssessment) return;
    setModalMode("edit");
    setIsAssessmentModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!selectedAssessment) return;
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
    scores: Array<{ assessmentItemId: string; score: number; note?: string }>;
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

  const handleSaveResultAndNext = async (data: {
    notes: string;
    scores: Array<{ assessmentItemId: string; score: number; note?: string }>;
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
      triggerToast("Nilai berhasil disimpan.");

      if (hasNextParticipant) {
        const nextSantri = filteredParticipants[currentParticipantIndex + 1];
        setSelectedSantriId(nextSantri.id);
      } else {
        setIsScoreModalOpen(false);
      }
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
            selectedAssessment.items.map((item) => {
              const rawScore = scoreByItemId.get(item.id) ?? 0;
              return [
                item.label,
                selectedAssessment.assessmentType === "qualitative"
                  ? getQualitativeLabel(rawScore)
                  : rawScore,
              ];
            })
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
            semesterLabel:
              selectedReportSemester === "ganjil" ? "Ganjil" : "Genap",
            minimumScore: selectedAssessment.minimumScore,
            attendancePresent: row.attendancePresent,
            attendancePermission: row.attendancePermission,
            attendanceAbsent: row.attendanceAbsent,
            scores: selectedAssessment.items.map((item) => {
              const score = scoreByItemId.get(item.id) ?? 0;
              const matchingScoreObj = row.result.scores.find(
                (s) => s.assessmentItemId === item.id
              );
              return {
                label: item.label,
                score,
                maxScore: item.maxScore,
                note: matchingScoreObj?.note,
              };
            }),
            notes: row.result.notes || "Belum ada catatan.",
          };
        }),
        `report-${fileName}.pdf`,
        (progress) => setPdfProgress(progress)
      );

      triggerToast("PDF Raport berhasil diunduh.");
    } catch (error) {
      console.error(error);
      triggerToast("Gagal membuat PDF Raport.", "error");
    } finally {
      setIsPdfGenerating(false);
    }
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
        <PageHeader
          title={isDetailPage ? (selectedAssessment?.name || "Detail Penilaian") : "Penilaian"}
          subtitle={
            isDetailPage
              ? `${selectedAssessment?.participants.length || 0} ${terms.studentSingularLower} • Nilai Minimum ${
                  selectedAssessment?.assessmentType === "qualitative"
                    ? getQualitativeLabel(selectedAssessment.minimumScore)
                    : selectedAssessment?.minimumScore || 0
                }`
              : activeTab === "daily"
                ? "Daftar penilaian yang dijadikan penilaian harian (talaqqi, hafalan, doa, adab, dll)."
                : "Daftar seluruh format penilaian aktif (harian, ujian berkala, raport semester)."
          }
          backTo={isDetailPage ? "/penilaian" : "/dashboard"}
          actions={
            !isDetailPage ? (
              <Button
                type="button"
                onClick={() => openCreateModal(activeTab === "daily")}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={17} strokeWidth={2} />
                {activeTab === "daily" ? "Tambah Penilaian Harian" : "Tambah Penilaian"}
              </Button>
            ) : selectedAssessment ? (
              <div className="flex flex-wrap items-center gap-2">
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
                  className="gap-1.5"
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
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.8} />
                  {isPdfGenerating ? "Membuat PDF..." : "Cetak Raport"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openEditModal}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openDeleteModal}
                  className="gap-1.5 text-danger hover:bg-danger-subtle hover:text-danger hover:border-danger-border"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Hapus
                </Button>
              </div>
            ) : undefined
          }
        />

        {isLoading ? (
          <LoadingState size="lg" text="Memuat Data" />
        ) : !isDetailPage ? (
          <div className="space-y-4">
            {/* Tab Bar: Penilaian Harian & Semua Penilaian */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("daily")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "daily"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Penilaian Harian
                {dailyAssessmentsList.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {dailyAssessmentsList.length}
                  </Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "list"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Penilaian
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {assessments.length}
                </Badge>
              </button>
            </div>

            {activeTab === "daily" ? (
              /* TAB: PENILAIAN HARIAN */
              <main>
                <Card className="gap-0 py-0">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b py-4">
                    <div>
                      <CardTitle>Penilaian Harian</CardTitle>
                      <CardDescription>
                        Pilih penilaian harian di bawah ini untuk menilai santri pada sesi mengaji.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openCreateModal(true)}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
                      Tambah Penilaian Harian
                    </Button>
                  </CardHeader>

                  {dailyAssessmentsList.length > 0 ? (
                    <motion.div
                      variants={staggerContainerVariants}
                      initial={shouldReduceMotion ? false : "hidden"}
                      animate="visible"
                      className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {dailyAssessmentsList.map((assessment) => (
                        <motion.div
                          key={assessment.id}
                          variants={staggerItemVariants}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                          transition={springSnappy}
                        >
                          <Link
                            to={`/penilaian/${assessment.id}`}
                            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/60 shadow-xs h-full"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                  {assessment.name}
                                </h4>
                                <Badge variant="secondary" className="shrink-0 text-[11px]">
                                  Harian
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <Badge variant="outline" className="text-[11px]">
                                  {assessment.assessmentType === "qualitative"
                                    ? "Kualitatif (A-D)"
                                    : assessment.assessmentType === "scale"
                                      ? "Skala 1-5"
                                      : "Nilai 0-100"}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {assessment.items.length} butir aspek
                                </span>
                              </div>

                              {/* Preview butir aspek penilaian */}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {assessment.items.map((item, iIdx) => (
                                  <Badge
                                    key={iIdx}
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5"
                                  >
                                    {item.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3.5 flex items-center justify-between border-t border-border pt-2 text-xs">
                              <span className="text-muted-foreground">
                                <strong className="font-semibold text-foreground">
                                  {getResultCount(assessment)}
                                </strong>{" "}
                                / {assessment.participants.length} selesai
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:underline">
                                <span>Pilih & Nilai</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="p-8 text-center space-y-2.5">
                      <p className="text-sm font-semibold text-foreground">
                        Belum Ada Penilaian Harian
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Penilaian harian digunakan guru untuk menilai setoran mengaji rutin (hafalan, tilawah, doa, adab, dll). Klik tombol di bawah untuk membuat format baru.
                      </p>
                      <Button
                        type="button"
                        onClick={() => openCreateModal(true)}
                        className="text-xs mt-1"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
                        Buat Penilaian Harian
                      </Button>
                    </div>
                  )}
                </Card>
              </main>
            ) : (
              /* TAB: SEMUA PENILAIAN */
              <main>
                <Card className="gap-0 py-0">
                  <CardHeader className="border-b py-4">
                    <CardTitle>Semua Penilaian</CardTitle>
                    <CardDescription>
                      {assessments.length} format penilaian terdaftar
                    </CardDescription>
                  </CardHeader>

                  {assessments.length > 0 ? (
                    <motion.div
                      variants={staggerContainerVariants}
                      initial={shouldReduceMotion ? false : "hidden"}
                      animate="visible"
                      className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {assessments.map((assessment) => (
                        <motion.div
                          key={assessment.id}
                          variants={staggerItemVariants}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                          transition={springSnappy}
                        >
                          <Link
                            to={`/penilaian/${assessment.id}`}
                            className="block rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/60 shadow-xs h-full"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground leading-snug">
                                {assessment.name}
                              </p>
                              {assessment.isDaily && (
                                <Badge variant="secondary" className="shrink-0 text-[11px]">
                                  Harian
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[11px]">
                                {assessment.assessmentType === "qualitative"
                                  ? "Kualitatif (A-D)"
                                  : assessment.assessmentType === "scale"
                                    ? "Skala 1-5"
                                    : "Nilai 0-100"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {assessment.items.length} butir
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {getResultCount(assessment)}/
                                {assessment.participants.length} selesai
                              </Badge>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="p-8 text-center space-y-2.5">
                      <p className="text-sm font-semibold text-foreground">
                        Belum ada penilaian yang dibuat.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Klik Tambah Penilaian untuk membuat format penilaian pertama.
                      </p>
                      <Button
                        type="button"
                        onClick={() => openCreateModal(false)}
                        className="text-xs mt-1"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
                        Tambah Penilaian
                      </Button>
                    </div>
                  )}
                </Card>
              </main>
            )}
          </div>
        ) : selectedAssessment ? (
          /* DETAIL PENILAIAN (/penilaian/:id): TEMPAT GURU MENILAI SANTRI */
          <main>
            <Card className="gap-0 py-0">
              <CardHeader className="no-print border-b p-4">
                {!selectedAssessment.isDaily && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3.5 mb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Periode Kehadiran Report
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reportDateRangeLabel}
                        </p>
                      </div>

                      <div className="inline-flex rounded-lg bg-muted p-1 gap-1 w-full sm:w-auto">
                        <button
                          type="button"
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                            reportRangeMode === "semester"
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setReportRangeMode("semester")}
                        >
                          Semester
                        </button>
                        <button
                          type="button"
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                            reportRangeMode === "custom"
                              ? "bg-background text-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
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
                          <Label className="mb-1 text-xs text-muted-foreground">Tahun Ajaran</Label>
                          <Select
                            value={String(selectedReportAcademicYearStart)}
                            onValueChange={(val) =>
                              setSelectedReportAcademicYearStart(Number(val))
                            }
                          >
                            <SelectTrigger className="h-8.5 w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {reportAcademicYearOptions.map((year) => (
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
                        <div>
                          <Label className="mb-1 text-xs text-muted-foreground">Semester</Label>
                          <Select
                            value={selectedReportSemester}
                            onValueChange={(val) =>
                              setSelectedReportSemester(
                                val as AcademicSemester
                              )
                            }
                          >
                            <SelectTrigger className="h-8.5 w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ganjil">Ganjil</SelectItem>
                              <SelectItem value="genap">Genap</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1 text-xs text-muted-foreground">Awal Absensi Report</Label>
                          <Input
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            type="date"
                            className="h-8.5 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 text-xs text-muted-foreground">Akhir Absensi Report</Label>
                          <Input
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            type="date"
                            className="h-8.5 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      Daftar {terms.studentSingularTitle}
                    </CardTitle>
                    <CardDescription>
                      Pilih santri untuk memasukkan atau memperbarui nilai evaluasi.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {selectedAssessment.results.length} / {selectedAssessment.participants.length} dinilai
                  </Badge>
                </div>
              </CardHeader>

              <div className="space-y-3.5 p-4">
                <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <SearchInput
                    value={studentSearch}
                    onChange={setStudentSearch}
                    placeholder={`Cari ${terms.studentSingularLower}...`}
                  />
                </section>

                <section>
                  {filteredParticipants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredParticipants.map((santri) => {
                        const res = getResultBySantriId(santri.id);
                        return (
                          <motion.button
                            key={santri.id}
                            type="button"
                            whileTap={
                              shouldReduceMotion ? undefined : { scale: 0.99 }
                            }
                            transition={springSnappy}
                            className="group rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/60 shadow-xs cursor-pointer"
                            onClick={() => openScoreModal(santri.id)}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                  {santri.nama}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {getJilidName(santri.jilidId)} · {getGuruName(santri.guruId)}
                                </span>
                              </span>
                              <Badge
                                variant={res ? "secondary" : "outline"}
                                className={res ? "shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700" : "shrink-0"}
                              >
                                {res ? "Selesai" : "Belum"}
                              </Badge>
                            </span>

                            <span className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2 text-xs">
                              <span className="text-muted-foreground">
                                {res ? (
                                  selectedAssessment.assessmentType === "qualitative" &&
                                  res.scores.length > 0 ? (
                                    <span>
                                      Predikat:{" "}
                                      <strong className="font-semibold text-foreground">
                                        {getQualitativeGrade(
                                          res.scores.reduce((s, c) => s + c.score, 0) /
                                            res.scores.length
                                        )}
                                      </strong>
                                    </span>
                                  ) : (
                                    "Nilai terisi"
                                  )
                                ) : (
                                  "Belum dinilai"
                                )}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:underline">
                                <span>{res ? "Edit Nilai" : "Mulai Menilai"}</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border px-4 py-10 text-center text-xs text-muted-foreground">
                      Tidak ada {terms.studentSingularLower} yang sesuai.
                    </div>
                  )}
                </section>
              </div>
            </Card>
          </main>
        ) : (
          <main>
            <Card className="gap-0 py-0">
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Penilaian tidak ditemukan.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kembali ke daftar penilaian untuk memilih data yang tersedia.
                </p>
              </div>
            </Card>
          </main>
        )}

        {/* Modal Beri Nilai Santri: Guru Tinggal Menilai & Bisa Lanjut ke Santri Berikutnya */}
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
          currentIndex={currentParticipantIndex}
          totalSantri={filteredParticipants.length}
          hasNextSantri={hasNextParticipant}
          onSubmit={handleSaveResult}
          onSubmitAndNext={handleSaveResultAndNext}
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

        {/* Preview Raport PDF Dialog */}
        <Dialog open={isReportVisible} onOpenChange={setIsReportVisible}>
          <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <DialogTitle>Preview Report Penilaian</DialogTitle>
                  <DialogDescription>
                    Hasil penilaian dan kehadiran santri
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="self-start sm:self-auto"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Halaman
                </Button>
              </div>
            </DialogHeader>

            {selectedAssessment && (
              <div className="space-y-6">
                {reportRows.map((row) => (
                  <article
                    key={row.santri.id}
                    className="assessment-report-page space-y-4 rounded-xl border p-4 sm:p-5"
                  >
                    <div className="assessment-report-header space-y-3 border-b pb-4">
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

      {/* Modal Buat / Edit Penilaian: Tempat Menentukan Aspek (Hafalan, Doa, Adab, dll), Tipe, dan Jadikan Harian */}
      <AssessmentFormDialog
        open={isAssessmentModalOpen}
        onOpenChange={setIsAssessmentModalOpen}
        title={modalMode === "create" ? (createIsDaily ? "Tambah Penilaian Harian" : "Tambah Penilaian") : "Edit Penilaian"}
        description={
          modalMode === "create"
            ? "Tentukan apa yang mau dinilai (hafalan, doa, adab, dll), tipe penilaian, dan peserta."
            : "Perbarui format penilaian dan peserta."
        }
        submitText={modalMode === "create" ? "Selesai" : "Simpan Perubahan"}
        saving={isSaving}
        initialValue={assessmentInitialValue}
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
