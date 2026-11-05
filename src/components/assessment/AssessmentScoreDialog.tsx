import React, { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  PlusSignIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Assessment,
  AssessmentResult,
  DailyAssessmentSummary,
  Santri,
} from "@/types";
import {
  QUALITATIVE_GRADES,
  getQuickChipsForAspect,
} from "@/utils/assessmentUtils";
import AssessmentRadarChart from "./AssessmentRadarChart";
import { summarizeDailyScoresForSantri } from "@/services/assessmentService";

export interface AssessmentScoreDialogProps {
  open: boolean;
  assessment: Assessment | null;
  santri: Santri | null;
  result: AssessmentResult | null;
  levelName: string;
  mentorName: string;
  saving?: boolean;
  currentIndex?: number;
  totalSantri?: number;
  hasNextSantri?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: {
    notes: string;
    scores: Array<{ assessmentItemId: string; score: number; note?: string }>;
  }) => void;
  onSubmitAndNext?: (value: {
    notes: string;
    scores: Array<{ assessmentItemId: string; score: number; note?: string }>;
  }) => void;
  onValidationError: (message: string) => void;
}

export const AssessmentScoreDialog: React.FC<AssessmentScoreDialogProps> = ({
  open,
  assessment,
  santri,
  result,
  levelName,
  mentorName,
  saving = false,
  currentIndex = 0,
  totalSantri = 0,
  hasNextSantri = false,
  onOpenChange,
  onSubmit,
  onSubmitAndNext,
  onValidationError,
}) => {
  const [scoreForm, setScoreForm] = useState<Record<string, number>>({});
  const [itemNotesForm, setItemNotesForm] = useState<Record<string, string>>({});
  const [notesForm, setNotesForm] = useState("");

  // State untuk fitur ringkasan harian
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState<DailyAssessmentSummary | null>(null);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);

  const maxScoreLabel =
    assessment?.assessmentType === "qualitative"
      ? "Kualitatif (A - D)"
      : assessment?.assessmentType === "scale"
        ? "Skala 1-5"
        : "Nilai 0-100";

  const scoreMapByItemId = useMemo(
    () =>
      new Map(
        (result?.scores ?? []).map((score) => [
          score.assessmentItemId,
          { score: score.score, note: score.note ?? "" },
        ]),
      ),
    [result],
  );

  useEffect(() => {
    if (open && assessment) {
      const nextScores: Record<string, number> = {};
      const nextNotes: Record<string, string> = {};

      assessment.items.forEach((item) => {
        const existing = scoreMapByItemId.get(item.id);
        nextScores[item.id] = existing?.score ?? 0;
        nextNotes[item.id] = existing?.note ?? "";
      });

      setScoreForm(nextScores);
      setItemNotesForm(nextNotes);
      setNotesForm(result?.notes ?? "");
      setSummaryPreview(null);
      setSummaryMessage(null);
    }
  }, [open, assessment, santri?.id, result?.id, scoreMapByItemId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && saving) return;
    onOpenChange(nextOpen);
  };

  const setScaleScore = (itemId: string, score: number) => {
    setScoreForm((prev) => ({
      ...prev,
      [itemId]: score,
    }));
  };

  const handleScoreChange = (itemId: string, value: string) => {
    setScoreForm((prev) => ({
      ...prev,
      [itemId]: Number(value),
    }));
  };

  const handleItemNoteChange = (itemId: string, note: string) => {
    setItemNotesForm((prev) => ({
      ...prev,
      [itemId]: note,
    }));
  };

  const handleQuickChipClick = (itemId: string, chipText: string) => {
    setItemNotesForm((prev) => {
      const current = prev[itemId]?.trim() || "";
      const updated = current ? `${current}, ${chipText}` : chipText;
      return {
        ...prev,
        [itemId]: updated,
      };
    });
  };

  // Fungsi untuk menarik dan merangkum penilaian harian
  const handlePullDailySummary = async () => {
    if (!santri || !assessment) return;
    setIsSummarizing(true);
    setSummaryMessage(null);

    try {
      const summary = await summarizeDailyScoresForSantri(santri.id);
      if (summary.totalSessions === 0) {
        setSummaryMessage("Belum ada data penilaian harian untuk santri ini.");
        setSummaryPreview(null);
      } else {
        setSummaryPreview(summary);
      }
    } catch (err) {
      setSummaryMessage("Gagal mengambil ringkasan penilaian harian.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Terapkan hasil ringkasan ke form
  const applyDailySummary = () => {
    if (!summaryPreview || !assessment) return;

    const nextScores = { ...scoreForm };
    const nextItemNotes = { ...itemNotesForm };

    assessment.items.forEach((item) => {
      const normalizedItem = item.label.toLowerCase();
      // Cocokkan aspek harian dengan aspek raport berdasarkan kesamaan nama
      const matched = summaryPreview.aspects.find(
        (a) =>
          normalizedItem.includes(a.itemLabel.toLowerCase()) ||
          a.itemLabel.toLowerCase().includes(normalizedItem),
      );

      if (matched) {
        if (assessment.assessmentType === "qualitative") {
          // Konversi skor rata-rata (1-4)
          nextScores[item.id] = Math.max(1, Math.min(4, Math.round(matched.averageScore)));
        } else if (assessment.assessmentType === "scale") {
          // Skala 1-5
          nextScores[item.id] = Math.max(1, Math.min(5, Math.round(matched.averageScore)));
        } else {
          // Skor 0-100: skala 4 ke 100
          nextScores[item.id] = Math.round((matched.averageScore / 4) * 100);
        }

        if (matched.sampleNotes.length > 0) {
          nextItemNotes[item.id] = matched.sampleNotes.join(". ");
        }
      }
    });

    setScoreForm(nextScores);
    setItemNotesForm(nextItemNotes);

    if (summaryPreview.compiledGeneralNotes.length > 0) {
      setNotesForm(
        (prev) =>
          prev ||
          `Rangkuman Harian: ${summaryPreview.compiledGeneralNotes.join(" | ")}`,
      );
    }

    setSummaryMessage("Ringkasan nilai harian berhasil diterapkan ke formulir.");
    setSummaryPreview(null);
  };

  const handleSubmit = (e?: React.FormEvent, advanceToNext = false) => {
    if (e) e.preventDefault();
    if (!assessment || !santri) return;

    for (const item of assessment.items) {
      const score = Number(scoreForm[item.id] ?? 0);
      if (assessment.assessmentType === "qualitative" && (score < 1 || score > 4)) {
        onValidationError(`Pilih predikat nilai (A/B/C/D) untuk ${item.label}.`);
        return;
      }
      if (Number.isNaN(score) || score < 0 || score > item.maxScore) {
        onValidationError(
          `Nilai ${item.label} harus antara 0 dan ${item.maxScore}.`,
        );
        return;
      }
    }

    const payload = {
      notes: notesForm,
      scores: assessment.items.map((item) => ({
        assessmentItemId: item.id,
        score: Number(scoreForm[item.id] ?? 0),
        note: itemNotesForm[item.id]?.trim() || undefined,
      })),
    };

    if (advanceToNext && onSubmitAndNext) {
      onSubmitAndNext(payload);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!bottom-0 !left-0 !top-auto !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-b-none !rounded-t-2xl !p-0 sm:!bottom-auto sm:!left-1/2 sm:!top-1/2 sm:!max-w-2xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b px-5 py-4 text-left shrink-0">
          <div className="flex items-start justify-between gap-4 pr-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-base font-semibold">
                  {santri ? `Nilai ${santri.nama}` : "Penilaian"}
                </DialogTitle>
                {result && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    Sudah dinilai
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs mt-0.5">
                {levelName} • {mentorName} • {maxScoreLabel}
              </DialogDescription>
            </div>

            {totalSantri > 0 && (
              <Badge variant="outline" className="shrink-0 text-xs">
                Santri {currentIndex + 1} / {totalSantri}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {assessment && santri && (
          <form
            className="flex flex-1 flex-col overflow-hidden"
            onSubmit={handleSubmit}
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Fitur Tarik Ringkasan Nilai Harian (Hanya untuk Penilaian Semester / Non-Harian) */}
              {!assessment.isDaily && (
                <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} className="text-primary" />
                        Tarik Ringkasan dari Penilaian Harian
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Otomatis hitung rata-rata skor & kompilasi catatan dari sesi penilaian harian santri ini.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSummarizing}
                      onClick={handlePullDailySummary}
                      className="shrink-0 text-xs h-7 px-2.5"
                    >
                      {isSummarizing ? "Menghitung..." : "Tarik Ringkasan"}
                    </Button>
                  </div>

                  {summaryMessage && (
                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                      {summaryMessage}
                    </p>
                  )}

                  {/* Preview Ringkasan Harian sebelum Diterapkan */}
                  {summaryPreview && (
                    <div className="mt-2 rounded-lg border border-border bg-card p-3 space-y-2.5 text-xs shadow-xs">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-semibold text-foreground">
                          Ditemukan {summaryPreview.totalSessions} Sesi Harian
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {summaryPreview.dateRange.start} s/d {summaryPreview.dateRange.end}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {summaryPreview.aspects.map((asp, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-border bg-muted/30 p-2"
                          >
                            <span className="text-muted-foreground block truncate text-[11px]">
                              {asp.itemLabel}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <strong className="text-foreground font-semibold">
                                {asp.averageScore}
                              </strong>
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                {asp.qualitativeGrade}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSummaryPreview(null)}
                          className="text-xs h-7"
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={applyDailySummary}
                          className="text-xs h-7"
                        >
                          Terapkan ke Form Raport
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result && (
                <AssessmentRadarChart
                  items={assessment.items}
                  scores={result.scores}
                  minimumScore={assessment.minimumScore}
                />
              )}

              {/* Daftar Butir Aspek Penilaian */}
              <div className="space-y-3">
                {assessment.items.map((item) => {
                  const quickChips = getQuickChipsForAspect(item.label);
                  const currentNote = itemNotesForm[item.id] ?? "";

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor={`score-${item.id}`}
                          className="text-xs font-semibold"
                        >
                          {item.label}
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {assessment.assessmentType === "qualitative"
                            ? "Predikat (A - D)"
                            : `Maks. ${item.maxScore}`}
                        </span>
                      </div>

                      {/* Score Input */}
                      {assessment.assessmentType === "qualitative" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {QUALITATIVE_GRADES.map((grade) => {
                            const isSelected =
                              Number(scoreForm[item.id] ?? 0) === grade.score;
                            return (
                              <Button
                                key={`${item.id}-${grade.score}`}
                                type="button"
                                variant="outline"
                                className={`h-11 flex flex-col items-center justify-center p-1 rounded-lg transition-colors cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-2xs font-semibold"
                                    : "hover:bg-accent/70"
                                }`}
                                aria-pressed={isSelected}
                                onClick={() => setScaleScore(item.id, grade.score)}
                              >
                                <span className="text-sm font-semibold leading-tight">
                                  {grade.grade}
                                </span>
                                <span
                                  className={`text-[10px] leading-tight mt-0.5 ${
                                    isSelected
                                      ? "text-primary-foreground/90"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {grade.desc}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      ) : assessment.assessmentType === "scale" ? (
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const isSelected = Number(scoreForm[item.id] ?? 0) === score;
                            return (
                              <Button
                                key={`${item.id}-${score}`}
                                type="button"
                                variant="outline"
                                className={`h-9 px-0 text-xs font-medium cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-2xs"
                                    : "hover:bg-accent/70"
                                }`}
                                aria-pressed={isSelected}
                                onClick={() => setScaleScore(item.id, score)}
                              >
                                {score}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <Input
                          id={`score-${item.id}`}
                          value={scoreForm[item.id] ?? 0}
                          onChange={(e) =>
                            handleScoreChange(item.id, e.target.value)
                          }
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={item.maxScore}
                          step={1}
                          className="h-8 text-xs"
                        />
                      )}

                      {/* Catatan Per Butir Nilai (Per-Item Clarity) */}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <Label
                          htmlFor={`note-${item.id}`}
                          className="text-[11px] font-medium text-muted-foreground"
                        >
                          Catatan Evaluasi {item.label} (Opsional)
                        </Label>
                        <Input
                          id={`note-${item.id}`}
                          placeholder={`Catatan spesifik untuk ${item.label.toLowerCase()}...`}
                          value={currentNote}
                          onChange={(e) =>
                            handleItemNoteChange(item.id, e.target.value)
                          }
                          className="h-8 text-xs"
                        />

                        {/* Quick Chips untuk Catatan Raport */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium mr-0.5">
                            Saran:
                          </span>
                          {quickChips.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleQuickChipClick(item.id, chip)}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                            >
                              <HugeiconsIcon icon={PlusSignIcon} size={11} strokeWidth={2} />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catatan Umum Raport */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="assessment-notes" className="text-xs font-semibold">
                  Catatan Umum / Kesimpulan Raport
                </Label>
                <Textarea
                  id="assessment-notes"
                  value={notesForm}
                  onChange={(e) => setNotesForm(e.target.value)}
                  rows={3}
                  placeholder="Catatan perkembangan kepribadian, akhlak, atau pesan khusus untuk wali santri..."
                  className="text-xs resize-none"
                />
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-border bg-background px-5 py-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleOpenChange(false)}
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={(e) => handleSubmit(e, false)}
                  >
                    {saving
                      ? "Menyimpan..."
                      : result
                        ? "Simpan Perubahan"
                        : "Simpan Nilai"}
                  </Button>

                  {hasNextSantri && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving}
                      onClick={(e) => handleSubmit(e, true)}
                      className="flex items-center gap-1.5"
                    >
                      <span>{saving ? "Menyimpan..." : "Simpan & Santri Berikutnya"}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentScoreDialog;
