import React, { useEffect, useMemo, useState } from "react";
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
  Santri,
} from "@/types";
import AssessmentRadarChart from "./AssessmentRadarChart";

export interface AssessmentScoreDialogProps {
  open: boolean;
  assessment: Assessment | null;
  santri: Santri | null;
  result: AssessmentResult | null;
  levelName: string;
  mentorName: string;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: {
    notes: string;
    scores: Array<{ assessmentItemId: string; score: number }>;
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
  onOpenChange,
  onSubmit,
  onValidationError,
}) => {
  const [scoreForm, setScoreForm] = useState<Record<string, number>>({});
  const [notesForm, setNotesForm] = useState("");

  const maxScoreLabel =
    assessment?.assessmentType === "scale" ? "Skala 1-5" : "Nilai 0-100";

  const scoreByItemId = useMemo(
    () =>
      new Map(
        (result?.scores ?? []).map((score) => [
          score.assessmentItemId,
          score.score,
        ]),
      ),
    [result],
  );

  useEffect(() => {
    if (open && assessment) {
      const nextScores: Record<string, number> = {};
      assessment.items.forEach((item) => {
        nextScores[item.id] = scoreByItemId.get(item.id) ?? 0;
      });
      setScoreForm(nextScores);
      setNotesForm(result?.notes ?? "");
    }
  }, [open, assessment, santri?.id, result?.id, scoreByItemId]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment || !santri) return;

    for (const item of assessment.items) {
      const score = Number(scoreForm[item.id] ?? 0);
      if (Number.isNaN(score) || score < 0 || score > item.maxScore) {
        onValidationError(
          `Nilai ${item.label} harus antara 0 dan ${item.maxScore}.`,
        );
        return;
      }
    }

    onSubmit({
      notes: notesForm,
      scores: assessment.items.map((item) => ({
        assessmentItemId: item.id,
        score: Number(scoreForm[item.id] ?? 0),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!bottom-0 !left-0 !top-auto !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-b-none !rounded-t-2xl !p-0 sm:!bottom-auto sm:!left-1/2 sm:!top-1/2 sm:!max-w-2xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-lg">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {santri ? `Nilai ${santri.nama}` : "Penilaian"}
              </DialogTitle>
              <DialogDescription>
                {levelName} - {mentorName} - {maxScoreLabel}
              </DialogDescription>
            </div>
            {result && (
              <Badge
                variant="secondary"
                className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Sudah dinilai
              </Badge>
            )}
          </div>
        </DialogHeader>

        {assessment && santri && (
          <form
            className="flex max-h-[82vh] flex-col sm:max-h-[78vh]"
            onSubmit={handleSubmit}
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {result && (
                <AssessmentRadarChart
                  items={assessment.items}
                  scores={result.scores}
                  minimumScore={assessment.minimumScore}
                />
              )}

              <div className="space-y-3">
                {assessment.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Label htmlFor={`score-${item.id}`}>{item.label}</Label>
                      <span className="text-xs text-muted-foreground">
                        Maks. {item.maxScore}
                      </span>
                    </div>

                    {assessment.assessmentType === "scale" ? (
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Button
                            key={`${item.id}-${score}`}
                            type="button"
                            variant="outline"
                            className={`h-10 px-0 ${
                              Number(scoreForm[item.id] ?? 0) === score
                                ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : ""
                            }`}
                            aria-pressed={
                              Number(scoreForm[item.id] ?? 0) === score
                            }
                            onClick={() => setScaleScore(item.id, score)}
                          >
                            {score}
                          </Button>
                        ))}
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
                      />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="assessment-notes">Catatan Tambahan</Label>
                <Textarea
                  id="assessment-notes"
                  value={notesForm}
                  onChange={(e) => setNotesForm(e.target.value)}
                  rows={4}
                  placeholder="Catatan opsional untuk siswa ini..."
                />
              </div>
            </div>

            <div className="border-t border-border bg-background px-5 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Menyimpan..."
                    : result
                      ? "Simpan Perubahan"
                      : "Submit Penilaian"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentScoreDialog;

