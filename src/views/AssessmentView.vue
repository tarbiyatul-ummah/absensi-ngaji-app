<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as XLSX from "xlsx";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Pencil,
  Printer,
  Trash2,
} from "@lucide/vue";
import { HugeiconsIcon } from "@hugeicons/vue";
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
import AssessmentFormDialog from "../components/assessment/AssessmentFormDialog.vue";
import AssessmentRadarChart from "../components/assessment/AssessmentRadarChart.vue";
import AssessmentScoreDialog from "../components/assessment/AssessmentScoreDialog.vue";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import Toast from "../components/master/Toast.vue";
import { organizationConfig, terms } from "../config/organization";
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

const route = useRoute();
const router = useRouter();
const routeAssessmentId = computed(() => String(route.params.id ?? ""));
const isDetailPage = computed(() => Boolean(routeAssessmentId.value));

const assessments = ref<Assessment[]>([]);
const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const academicYearList = ref<AcademicYear[]>([]);
const selectedAssessmentId = ref("");
const selectedSantriId = ref("");
const studentSearch = ref("");
const selectedReportAcademicYearStart = ref(getCurrentAcademicYearStart());
const selectedReportSemester = ref<AcademicSemester>(getCurrentSemester());
const reportRangeMode = ref<"semester" | "custom">("semester");
const defaultReportRange = getSemesterRange(
  selectedReportAcademicYearStart.value,
  selectedReportSemester.value,
);
const reportStartDate = ref(defaultReportRange.start);
const reportEndDate = ref(defaultReportRange.end);
const reportRows = ref<AssessmentReportRow[]>([]);
const isReportVisible = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isPdfGenerating = ref(false);
const isAssessmentModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isScoreModalOpen = ref(false);
const isActionsMenuOpen = ref(false);
const actionsMenuRef = ref<HTMLElement | null>(null);
const pdfProgress = ref<AssessmentPdfProgress>({
  current: 0,
  total: 0,
  message: "",
});
const modalMode = ref<"create" | "edit">("create");
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const triggerToast = (
  message: string,
  type: "success" | "error" = "success",
) => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

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

const sortedSantriList = computed(() =>
  santriList.value.slice().sort((a, b) => a.nama.localeCompare(b.nama)),
);

const activeAssessmentId = computed(() =>
  isDetailPage.value ? routeAssessmentId.value : selectedAssessmentId.value,
);

const selectedAssessment = computed(
  () =>
    assessments.value.find(
      (assessment) => assessment.id === activeAssessmentId.value,
    ) ?? null,
);

const selectedParticipants = computed(() => {
  if (!selectedAssessment.value) return [];

  const participantIds = new Set(
    selectedAssessment.value.participants.map(
      (participant) => participant.santriId,
    ),
  );

  return sortedSantriList.value.filter((santri) =>
    participantIds.has(santri.id),
  );
});

const filteredParticipants = computed(() => {
  const keyword = studentSearch.value.trim().toLowerCase();
  if (!keyword) return selectedParticipants.value;

  return selectedParticipants.value.filter((santri) =>
    [santri.nama, getJilidName(santri.jilidId), getGuruName(santri.guruId)]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
});

const selectedSantri = computed(
  () =>
    selectedParticipants.value.find(
      (santri) => santri.id === selectedSantriId.value,
    ) ?? null,
);

const selectedResult = computed(() => {
  if (!selectedAssessment.value || !selectedSantriId.value) return null;

  return (
    selectedAssessment.value.results.find(
      (result) => result.santriId === selectedSantriId.value,
    ) ?? null
  );
});

const assessmentInitialValue = computed<AssessmentFormData | null>(() => {
  if (!selectedAssessment.value) return null;

  return {
    name: selectedAssessment.value.name,
    assessmentType: selectedAssessment.value.assessmentType,
    minimumScore: selectedAssessment.value.minimumScore,
    items: selectedAssessment.value.items.map((item) => ({
      id: item.id,
      label: item.label,
    })),
    santriIds: selectedAssessment.value.participants.map(
      (participant) => participant.santriId,
    ),
  };
});

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

const getSemesterLabel = (semester: AcademicSemester) =>
  semester === "ganjil" ? "Ganjil" : "Genap";

const getResultCount = (assessment: Assessment) => assessment.results.length;

const getResultBySantriId = (santriId: string) =>
  selectedAssessment.value?.results.find(
    (result) => result.santriId === santriId,
  ) ?? null;

const reportAcademicYearOptions = computed(() => {
  if (academicYearList.value.length > 0) {
    return academicYearList.value
      .slice()
      .sort((a, b) => b.startYear - a.startYear)
      .map((year) => ({
        startYear: year.startYear,
        label: getAcademicYearLabel(year.startYear),
      }));
  }

  return getAcademicYearOptions(selectedReportAcademicYearStart.value);
});

const selectedReportRange = computed(() => {
  if (reportRangeMode.value === "custom") {
    return {
      start: reportStartDate.value,
      end: reportEndDate.value,
    };
  }

  return getSemesterRange(
    selectedReportAcademicYearStart.value,
    selectedReportSemester.value,
  );
});

const reportDateRangeLabel = computed(
  () =>
    `${formatDateLong(selectedReportRange.value.start)} - ${formatDateLong(
      selectedReportRange.value.end,
    )}`,
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

const buildReportRows = async () => {
  if (!selectedAssessment.value) return [];
  const range = selectedReportRange.value;

  if (range.start > range.end) {
    triggerToast(
      "Tanggal awal report tidak boleh melewati tanggal akhir.",
      "error",
    );
    return [];
  }

  const assessedResults = selectedAssessment.value.results.filter(
    (result) => result.scores.length > 0,
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
  const santriById = new Map(
    santriList.value.map((santri) => [santri.id, santri]),
  );

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
      "error",
    );
  }

  return rows;
};

const openCreateModal = () => {
  modalMode.value = "create";
  isAssessmentModalOpen.value = true;
};

const openEditModal = () => {
  if (!selectedAssessment.value) return;

  isActionsMenuOpen.value = false;
  modalMode.value = "edit";
  isAssessmentModalOpen.value = true;
};

const openDeleteModal = () => {
  if (!selectedAssessment.value) return;

  isActionsMenuOpen.value = false;
  isDeleteModalOpen.value = true;
};

const loadData = async () => {
  isLoading.value = true;

  try {
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

    const activeAcademicYear = academicYearRes.find((year) => year.isActive);
    if (activeAcademicYear && reportRangeMode.value === "semester") {
      selectedReportAcademicYearStart.value = activeAcademicYear.startYear;
    }

    const assessmentRes = await getAssessments();
    assessments.value = assessmentRes;

    if (isDetailPage.value) {
      selectedAssessmentId.value = routeAssessmentId.value;
    } else if (
      !selectedAssessmentId.value ||
      !assessmentRes.some(
        (assessment) => assessment.id === selectedAssessmentId.value,
      )
    ) {
      selectedAssessmentId.value = assessmentRes[0]?.id ?? "";
    }
  } catch (error) {
    console.error(error);
    triggerToast(
      formatAssessmentError(
        error,
        "Data penilaian belum bisa dimuat. Pastikan assessment_schema.sql terbaru sudah dijalankan.",
      ),
      "error",
    );
  } finally {
    isLoading.value = false;
  }
};

const handleSaveAssessment = async (data: AssessmentFormData) => {
  isSaving.value = true;

  try {
    if (modalMode.value === "create") {
      selectedAssessmentId.value = await addAssessment(data);
      triggerToast("Penilaian berhasil dibuat.");
    } else if (selectedAssessment.value) {
      await updateAssessment(selectedAssessment.value.id, data);
      triggerToast("Penilaian berhasil diperbarui.");
    }

    isAssessmentModalOpen.value = false;
    await loadData();

    if (modalMode.value === "create" && selectedAssessmentId.value) {
      await router.push(`/penilaian/${selectedAssessmentId.value}`);
    }
  } catch (error) {
    console.error(error);
    triggerToast(
      formatAssessmentError(error, "Penilaian gagal disimpan."),
      "error",
    );
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteAssessment = async () => {
  if (!selectedAssessment.value) return;

  isSaving.value = true;
  try {
    await deleteAssessment(selectedAssessment.value.id);
    isDeleteModalOpen.value = false;
    selectedAssessmentId.value = "";
    await router.push("/penilaian");
    await loadData();
    triggerToast("Penilaian berhasil dihapus.");
  } catch (error) {
    triggerToast("Penilaian gagal dihapus.", "error");
  } finally {
    isSaving.value = false;
  }
};

const openScoreModal = (santriId: string) => {
  selectedSantriId.value = santriId;
  isScoreModalOpen.value = true;
};

const handleSaveResult = async (data: {
  notes: string;
  scores: Array<{ assessmentItemId: string; score: number }>;
}) => {
  if (!selectedAssessment.value || !selectedSantriId.value) return;

  isSaving.value = true;
  try {
    await saveAssessmentResult({
      assessmentId: selectedAssessment.value.id,
      santriId: selectedSantriId.value,
      notes: data.notes,
      scores: data.scores,
    });
    await loadData();
    isScoreModalOpen.value = false;
    triggerToast("Nilai berhasil disimpan.");
  } catch (error) {
    triggerToast("Nilai gagal disimpan.", "error");
  } finally {
    isSaving.value = false;
  }
};

const handleExportExcel = async () => {
  if (!selectedAssessment.value) return;

  isSaving.value = true;
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
          selectedAssessment.value!.items.map((item) => [
            item.label,
            scoreByItemId.get(item.id) ?? 0,
          ]),
        ),
        Catatan: row.result.notes ?? "",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    const fileName =
      sanitizeFileName(selectedAssessment.value.name) || "penilaian";

    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Penilaian");
    XLSX.writeFile(workbook, `report-${fileName}.xlsx`);
    triggerToast("Report Excel berhasil dibuat.");
  } catch (error) {
    triggerToast("Report Excel gagal dibuat.", "error");
  } finally {
    isSaving.value = false;
  }
};

const handleGenerateReport = async () => {
  if (!selectedAssessment.value) return;

  isPdfGenerating.value = true;
  pdfProgress.value = {
    current: 0,
    total: selectedAssessment.value.results.length,
    message: "Menyiapkan data report...",
  };
  try {
    const rows = await buildReportRows();
    if (rows.length === 0) return;

    const fileName =
      sanitizeFileName(selectedAssessment.value.name) || "penilaian";
    pdfProgress.value = {
      current: 0,
      total: rows.length,
      message: "Memuat generator PDF...",
    };
    const { generateAssessmentPdfReport } =
      await import("../services/assessmentPdfReportService");

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
          assessmentName: selectedAssessment.value!.name,
          organizationName: organizationConfig.name,
          logoUrl: organizationConfig.faviconUrl,
          academicYearLabel: getAcademicYearLabel(
            selectedReportAcademicYearStart.value,
          ),
          semesterLabel: getSemesterLabel(selectedReportSemester.value),
          minimumScore: selectedAssessment.value!.minimumScore,
          attendancePresent: row.attendancePresent,
          attendancePermission: row.attendancePermission,
          attendanceAbsent: row.attendanceAbsent,
          scores: selectedAssessment.value!.items.map((item) => ({
            label: item.label,
            score: scoreByItemId.get(item.id) ?? 0,
            maxScore: item.maxScore,
          })),
          notes: row.result.notes ?? "",
        };
      }),
      `report-${fileName}.pdf`,
      (progress) => {
        pdfProgress.value = progress;
      },
    );
    triggerToast("Report PDF berhasil dibuat.");
  } catch (error) {
    console.error(error);
    triggerToast("Report PDF gagal dibuat.", "error");
  } finally {
    isPdfGenerating.value = false;
  }
};

const handlePrintReport = () => {
  window.print();
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!actionsMenuRef.value?.contains(event.target as Node)) {
    isActionsMenuOpen.value = false;
  }
};

watch(selectedAssessment, (assessment) => {
  if (!assessment) {
    selectedSantriId.value = "";
    return;
  }

  const participantIds = new Set(
    assessment.participants.map((participant) => participant.santriId),
  );

  if (!participantIds.has(selectedSantriId.value)) {
    selectedSantriId.value = selectedParticipants.value[0]?.id ?? "";
  }
});

watch(routeAssessmentId, (assessmentId) => {
  selectedAssessmentId.value = assessmentId;
  studentSearch.value = "";
  isReportVisible.value = false;
  reportRows.value = [];
});

watch(
  [
    reportRangeMode,
    selectedReportAcademicYearStart,
    selectedReportSemester,
    reportStartDate,
    reportEndDate,
  ],
  () => {
    isReportVisible.value = false;
    reportRows.value = [];
  },
);

onMounted(() => {
  void loadData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<template>
  <div class="app-page">
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <div class="app-container-wide space-y-5">
      <Button as-child variant="ghost" size="sm" class="w-fit px-2">
        <RouterLink :to="isDetailPage ? '/penilaian' : '/dashboard'">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="16"
            color="currentColor"
            :stroke-width="1.7"
          />
          {{ isDetailPage ? "Penilaian" : "Dashboard" }}
        </RouterLink>
      </Button>

      <header class="app-header">
        <div>
          <h1 class="app-title">Penilaian</h1>
          <p class="app-subtitle">
            Buat format penilaian, pilih {{ terms.studentSingularLower }}, lalu
            isi nilai dan catatan perkembangan.
          </p>
        </div>
        <Button v-if="!isDetailPage" type="button" @click="openCreateModal">
          <HugeiconsIcon
            :icon="PlusSignIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Add Penilaian
        </Button>
      </header>

      <div v-if="isLoading" class="flex h-64 items-center justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
        ></div>
      </div>

      <main v-else-if="!isDetailPage">
        <Card class="gap-0 py-0">
          <CardHeader class="border-b py-4">
            <CardTitle>Daftar Penilaian</CardTitle>
            <CardDescription>
              {{ assessments.length }} penilaian aktif
            </CardDescription>
          </CardHeader>

          <div
            v-if="assessments.length > 0"
            class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <RouterLink
              v-for="assessment in assessments"
              :key="assessment.id"
              :to="`/penilaian/${assessment.id}`"
              class="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent"
            >
              <p class="text-sm font-semibold text-foreground">
                {{ assessment.name }}
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {{ assessment.items.length }} butir
                </Badge>
                <Badge variant="secondary">
                  {{ getResultCount(assessment) }}/{{
                    assessment.participants.length
                  }}
                  selesai
                </Badge>
              </div>
            </RouterLink>
          </div>

          <div v-else class="px-4 py-10 text-center">
            <p class="text-sm font-medium text-foreground">
              Belum ada penilaian.
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              Klik Add Penilaian untuk membuat format pertama.
            </p>
          </div>
        </Card>
      </main>

      <main v-else-if="selectedAssessment">
        <Card class="gap-0 py-0">
          <CardHeader class="no-print border-b py-4">
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <CardTitle>{{ selectedAssessment.name }}</CardTitle>
                <CardDescription>
                  {{ selectedAssessment.participants.length }}
                  {{ terms.studentSingularLower }} - Nilai Minimum
                  {{ selectedAssessment.minimumScore }}
                </CardDescription>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="
                    isSaving ||
                    isPdfGenerating ||
                    selectedAssessment.results.length === 0
                  "
                  @click="handleExportExcel"
                >
                  <FileSpreadsheet class="h-4 w-4" :stroke-width="1.8" />
                  Export Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="
                    isSaving ||
                    isPdfGenerating ||
                    selectedAssessment.results.length === 0
                  "
                  @click="handleGenerateReport"
                >
                  <FileText class="h-4 w-4" :stroke-width="1.8" />
                  {{ isPdfGenerating ? "Membuat PDF..." : "Generate Report" }}
                </Button>
                <div ref="actionsMenuRef" class="relative w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="w-full justify-center sm:w-auto"
                    @click.stop="isActionsMenuOpen = !isActionsMenuOpen"
                  >
                    <MoreVertical
                      class="h-4 w-4"
                      :stroke-width="1.8"
                      aria-hidden="true"
                    />
                    Lainnya
                  </Button>

                  <div
                    v-if="isActionsMenuOpen"
                    class="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      @click="openEditModal"
                    >
                      <Pencil
                        class="h-4 w-4"
                        :stroke-width="1.8"
                        aria-hidden="true"
                      />
                      Edit Penilaian
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                      @click="openDeleteModal"
                    >
                      <Trash2
                        class="h-4 w-4"
                        :stroke-width="1.8"
                        aria-hidden="true"
                      />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 space-y-3 rounded-lg border bg-muted/30 p-3">
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">
                    Periode Kehadiran Report
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ reportDateRangeLabel }}
                  </p>
                </div>

                <div
                  class="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-auto"
                >
                  <button
                    type="button"
                    class="rounded px-3 py-2 text-sm font-semibold transition-colors"
                    :class="
                      reportRangeMode === 'semester'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    "
                    @click="reportRangeMode = 'semester'"
                  >
                    Semester
                  </button>
                  <button
                    type="button"
                    class="rounded px-3 py-2 text-sm font-semibold transition-colors"
                    :class="
                      reportRangeMode === 'custom'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    "
                    @click="reportRangeMode = 'custom'"
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div
                v-if="reportRangeMode === 'semester'"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div>
                  <Label class="mb-1.5 text-xs">Tahun Ajaran</Label>
                  <select
                    v-model.number="selectedReportAcademicYearStart"
                    class="ui-select"
                  >
                    <option
                      v-for="year in reportAcademicYearOptions"
                      :key="year.startYear"
                      :value="year.startYear"
                    >
                      {{ year.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <Label class="mb-1.5 text-xs">Semester</Label>
                  <select v-model="selectedReportSemester" class="ui-select">
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label class="mb-1.5 text-xs">Awal Absensi Report</Label>
                  <Input v-model="reportStartDate" type="date" />
                </div>
                <div>
                  <Label class="mb-1.5 text-xs">Akhir Absensi Report</Label>
                  <Input v-model="reportEndDate" type="date" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-4 p-4">
            <section
              class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center"
            >
              <Input
                v-model="studentSearch"
                type="search"
                :placeholder="`Cari ${terms.studentSingularLower}...`"
              />
              <div
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Badge variant="secondary">
                  {{ selectedAssessment.results.length }}/{{
                    selectedAssessment.participants.length
                  }}
                  selesai
                </Badge>
              </div>
            </section>

            <section>
              <div
                v-if="filteredParticipants.length > 0"
                class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              >
                <button
                  v-for="santri in filteredParticipants"
                  :key="santri.id"
                  type="button"
                  class="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
                  @click="openScoreModal(santri.id)"
                >
                  <span class="flex items-start justify-between gap-3">
                    <span class="min-w-0">
                      <span
                        class="block truncate text-sm font-semibold text-foreground"
                      >
                        {{ santri.nama }}
                      </span>
                      <span
                        class="mt-1 block truncate text-xs text-muted-foreground"
                      >
                        {{ getJilidName(santri.jilidId) }} -
                        {{ getGuruName(santri.guruId) }}
                      </span>
                    </span>
                    <Badge
                      :variant="
                        getResultBySantriId(santri.id) ? 'secondary' : 'outline'
                      "
                      class="shrink-0"
                      :class="
                        getResultBySantriId(santri.id)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : ''
                      "
                    >
                      {{ getResultBySantriId(santri.id) ? "Selesai" : "Belum" }}
                    </Badge>
                  </span>

                  <span class="mt-4 flex items-center justify-between gap-3">
                    <span class="text-xs text-muted-foreground">
                      {{
                        getResultBySantriId(santri.id)
                          ? "Klik untuk edit nilai"
                          : "Klik untuk mulai menilai"
                      }}
                    </span>
                    <span class="text-sm font-semibold text-foreground">
                      {{
                        getResultBySantriId(santri.id) ? "Edit Nilai" : "Nilai"
                      }}
                    </span>
                  </span>
                </button>
              </div>

              <div
                v-else
                class="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground"
              >
                Tidak ada {{ terms.studentSingularLower }} yang sesuai.
              </div>
            </section>
          </CardContent>
        </Card>
      </main>

      <main v-else>
        <Card class="gap-0 py-0">
          <div class="px-4 py-16 text-center">
            <p class="text-sm font-medium text-foreground">
              Penilaian tidak ditemukan.
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              Kembali ke daftar penilaian untuk memilih data yang tersedia.
            </p>
          </div>
        </Card>
      </main>

      <AssessmentScoreDialog
        v-model:open="isScoreModalOpen"
        :assessment="selectedAssessment"
        :santri="selectedSantri"
        :result="selectedResult"
        :level-name="
          selectedSantri ? getJilidName(selectedSantri.jilidId) : '-'
        "
        :mentor-name="selectedSantri ? getGuruName(selectedSantri.guruId) : '-'"
        :saving="isSaving"
        @submit="handleSaveResult"
        @validation-error="(message) => triggerToast(message, 'error')"
      />

      <Dialog :open="isPdfGenerating">
        <DialogContent class="sm:max-w-sm" :show-close-button="false">
          <DialogHeader>
            <DialogTitle>Membuat PDF Report</DialogTitle>
            <DialogDescription>
              {{ pdfProgress.message || "Menyiapkan report..." }}
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-3">
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-foreground transition-all"
                :style="{
                  width: `${
                    pdfProgress.total > 0
                      ? Math.round(
                          (pdfProgress.current / pdfProgress.total) * 100,
                        )
                      : 8
                  }%`,
                }"
              ></div>
            </div>
            <p class="text-center text-sm text-muted-foreground">
              {{
                pdfProgress.total > 0
                  ? `${pdfProgress.current}/${pdfProgress.total} halaman`
                  : "Memulai..."
              }}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog :open="isReportVisible" @update:open="isReportVisible = $event">
        <DialogContent class="gap-0 p-0 sm:max-w-5xl">
          <DialogHeader class="no-print border-b px-5 py-4 text-left">
            <div
              class="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <DialogTitle>Report Penilaian</DialogTitle>
                <DialogDescription>
                  {{ selectedAssessment?.name }} - Periode absensi:
                  {{ reportDateRangeLabel }}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                class="w-full sm:w-auto"
                @click="handlePrintReport"
              >
                <Printer class="h-4 w-4" :stroke-width="1.8" />
                Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          <div
            v-if="selectedAssessment"
            class="assessment-report-print max-h-[78vh] space-y-4 overflow-y-auto p-5"
          >
            <article
              v-for="row in reportRows"
              :key="row.result.id"
              class="assessment-report-page space-y-4 rounded-lg border bg-background p-4"
            >
              <div class="space-y-3 border-b pb-3">
                <div
                  class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-start"
                >
                  <div>
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Report Penilaian
                    </p>
                    <h3 class="mt-1 text-lg font-semibold text-foreground">
                      {{ row.santri.nama }}
                    </h3>
                    <p class="text-sm text-muted-foreground">
                      {{ getJilidName(row.santri.jilidId) }} -
                      {{ getGuruName(row.santri.guruId) }}
                    </p>
                  </div>
                  <div class="text-left sm:text-right">
                    <p class="text-sm font-semibold text-foreground">
                      {{ selectedAssessment.name }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ reportDateRangeLabel }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div class="rounded-lg bg-muted px-3 py-2">
                    <p class="text-xs text-muted-foreground">Hadir</p>
                    <p class="text-xl font-semibold text-foreground">
                      {{ row.attendancePresent }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted px-3 py-2">
                    <p class="text-xs text-muted-foreground">Izin</p>
                    <p class="text-xl font-semibold text-foreground">
                      {{ row.attendancePermission }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted px-3 py-2">
                    <p class="text-xs text-muted-foreground">Alfa</p>
                    <p class="text-xl font-semibold text-foreground">
                      {{ row.attendanceAbsent }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-muted px-3 py-2">
                    <p class="text-xs text-muted-foreground">Tercatat</p>
                    <p class="text-xl font-semibold text-foreground">
                      {{ row.attendanceRecorded }}
                    </p>
                  </div>
                </div>
              </div>

              <div
                class="assessment-report-body grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]"
              >
                <AssessmentRadarChart
                  :items="selectedAssessment.items"
                  :scores="row.result.scores"
                  :minimum-score="selectedAssessment.minimumScore"
                />

                <div class="assessment-report-detail space-y-3">
                  <div class="overflow-hidden rounded-lg border">
                    <table class="w-full text-left text-sm">
                      <thead class="bg-muted text-muted-foreground">
                        <tr>
                          <th class="px-3 py-2 font-medium">Butir</th>
                          <th class="w-28 px-3 py-2 text-right font-medium">
                            Nilai
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y">
                        <tr
                          v-for="item in selectedAssessment.items"
                          :key="`${row.result.id}-${item.id}`"
                        >
                          <td class="px-3 py-2 text-foreground">
                            {{ item.label }}
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold text-foreground"
                          >
                            {{
                              getScoresByItemId(row.result.scores).get(
                                item.id,
                              ) ?? 0
                            }}/{{ item.maxScore }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p class="text-sm font-semibold text-foreground">Catatan</p>
                    <p
                      class="mt-1 whitespace-pre-wrap text-sm text-muted-foreground"
                    >
                      {{ row.result.notes || "Tidak ada catatan tambahan." }}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <AssessmentFormDialog
      v-model:open="isAssessmentModalOpen"
      :title="modalMode === 'create' ? 'Add Penilaian' : 'Edit Penilaian'"
      :description="
        modalMode === 'create'
          ? 'Buat format penilaian dan pilih peserta.'
          : 'Perbarui format penilaian dan peserta.'
      "
      :submit-text="modalMode === 'create' ? 'Selesai' : 'Simpan Perubahan'"
      :saving="isSaving"
      :initial-value="modalMode === 'edit' ? assessmentInitialValue : null"
      :santri-list="santriList"
      :jilid-list="jilidList"
      :guru-list="guruList"
      @submit="handleSaveAssessment"
      @validation-error="(message) => triggerToast(message, 'error')"
    />

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      title="Hapus Penilaian?"
      :message="`Penilaian ${selectedAssessment?.name ?? ''} akan dihapus dari daftar aktif.`"
      :confirm-text="isSaving ? 'Menghapus...' : 'Hapus Penilaian'"
      @confirm="handleDeleteAssessment"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 12mm;
}

@media print {
  html,
  body {
    width: 210mm;
    min-height: auto !important;
    background: white !important;
  }

  body * {
    visibility: hidden;
  }

  .assessment-report-print,
  .assessment-report-print * {
    visibility: visible;
  }

  .assessment-report-print {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    max-height: none !important;
    overflow: visible !important;
    padding: 0 !important;
    border: 0;
    box-shadow: none;
  }

  .assessment-report-page {
    box-sizing: border-box;
    height: calc(297mm - 24mm);
    margin: 0;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
  }

  .assessment-report-page,
  .assessment-report-page * {
    color: #000 !important;
  }

  .assessment-report-page .space-y-3 > :not([hidden]) ~ :not([hidden]),
  .assessment-report-page .space-y-4 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 8px !important;
  }

  .assessment-report-page .border-b {
    padding-bottom: 8px !important;
  }

  .assessment-report-page .rounded-lg {
    border-radius: 4px !important;
  }

  .assessment-report-page .bg-muted {
    background: #f7f7f7 !important;
  }

  .assessment-report-page h3 {
    font-size: 15px !important;
    line-height: 1.2 !important;
  }

  .assessment-report-page p {
    line-height: 1.25 !important;
  }

  .assessment-report-body {
    display: grid !important;
    grid-template-columns: 58% 42% !important;
    gap: 10px !important;
    align-items: start !important;
  }

  .assessment-report-body [role="img"] {
    height: 210px !important;
    max-width: 100% !important;
  }

  .assessment-report-body > .rounded-lg {
    padding: 10px !important;
  }

  .assessment-report-body h3 {
    font-size: 11px !important;
  }

  .assessment-report-body table {
    font-size: 11px !important;
  }

  .assessment-report-body th,
  .assessment-report-body td {
    padding: 5px 8px !important;
  }

  .assessment-report-detail {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .assessment-report-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .no-print {
    display: none !important;
  }
}
</style>
