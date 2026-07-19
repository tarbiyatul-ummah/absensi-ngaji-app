<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  AssessmentScore,
  Santri,
} from "../../types";
import AssessmentRadarChart from "./AssessmentRadarChart.vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    assessment: Assessment | null;
    santri: Santri | null;
    result: AssessmentResult | null;
    levelName: string;
    mentorName: string;
    saving?: boolean;
  }>(),
  {
    saving: false,
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (
    event: "submit",
    value: {
      notes: string;
      scores: Array<{ assessmentItemId: string; score: number }>;
    },
  ): void;
  (event: "validation-error", message: string): void;
}>();

const scoreForm = ref<Record<string, number>>({});
const notesForm = ref("");

const maxScoreLabel = computed(() =>
  props.assessment?.assessmentType === "scale" ? "Skala 1-5" : "Nilai 0-100",
);

const scoreByItemId = computed(
  () =>
    new Map(
      (props.result?.scores ?? []).map((score: AssessmentScore) => [
        score.assessmentItemId,
        score.score,
      ]),
    ),
);

const resetForm = () => {
  const nextScores: Record<string, number> = {};

  props.assessment?.items.forEach((item) => {
    nextScores[item.id] = scoreByItemId.value.get(item.id) ?? 0;
  });

  scoreForm.value = nextScores;
  notesForm.value = props.result?.notes ?? "";
};

const handleOpenChange = (open: boolean) => {
  if (!open && props.saving) return;
  emit("update:open", open);
};

const setScaleScore = (itemId: string, score: number) => {
  scoreForm.value[itemId] = score;
};

const handleSubmit = () => {
  if (!props.assessment || !props.santri) return;

  for (const item of props.assessment.items) {
    const score = Number(scoreForm.value[item.id] ?? 0);

    if (Number.isNaN(score) || score < 0 || score > item.maxScore) {
      emit(
        "validation-error",
        `Nilai ${item.label} harus antara 0 dan ${item.maxScore}.`,
      );
      return;
    }
  }

  emit("submit", {
    notes: notesForm.value,
    scores: props.assessment.items.map((item) => ({
      assessmentItemId: item.id,
      score: Number(scoreForm.value[item.id] ?? 0),
    })),
  });
};

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);

watch(
  () => [props.assessment?.id, props.santri?.id, props.result?.id],
  () => {
    if (props.open) resetForm();
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="!bottom-0 !left-0 !top-auto !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-b-none !rounded-t-2xl !p-0 sm:!bottom-auto sm:!left-1/2 sm:!top-1/2 sm:!max-w-2xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-lg"
    >
      <DialogHeader class="border-b px-5 py-4 text-left">
        <div class="flex items-start justify-between gap-4 pr-8">
          <div class="min-w-0">
            <DialogTitle class="truncate">
              {{ santri ? `Nilai ${santri.nama}` : "Penilaian" }}
            </DialogTitle>
            <DialogDescription>
              {{ levelName }} - {{ mentorName }} - {{ maxScoreLabel }}
            </DialogDescription>
          </div>
          <Badge
            v-if="result"
            variant="secondary"
            class="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Sudah dinilai
          </Badge>
        </div>
      </DialogHeader>

      <form
        v-if="assessment && santri"
        class="flex max-h-[82vh] flex-col sm:max-h-[78vh]"
        @submit.prevent="handleSubmit"
      >
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <AssessmentRadarChart
            v-if="result"
            :items="assessment.items"
            :scores="result.scores"
            :minimum-score="assessment.minimumScore"
          />

          <div class="space-y-3">
            <div
              v-for="item in assessment.items"
              :key="item.id"
              class="rounded-lg border p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <Label :for="`score-${item.id}`">
                  {{ item.label }}
                </Label>
                <span class="text-xs text-muted-foreground">
                  Maks. {{ item.maxScore }}
                </span>
              </div>

              <div
                v-if="assessment.assessmentType === 'scale'"
                class="grid grid-cols-5 gap-2"
              >
                <Button
                  v-for="score in 5"
                  :key="`${item.id}-${score}`"
                  type="button"
                  variant="outline"
                  class="h-10 px-0"
                  :class="
                    Number(scoreForm[item.id] ?? 0) === score
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      : ''
                  "
                  :aria-pressed="Number(scoreForm[item.id] ?? 0) === score"
                  @click="setScaleScore(item.id, score)"
                >
                  {{ score }}
                </Button>
              </div>

              <Input
                v-else
                :id="`score-${item.id}`"
                v-model.number="scoreForm[item.id]"
                type="number"
                inputmode="decimal"
                min="0"
                :max="item.maxScore"
                step="1"
              />
            </div>
          </div>

          <div>
            <Label for="assessment-notes">Catatan Tambahan</Label>
            <Textarea
              id="assessment-notes"
              v-model="notesForm"
              rows="4"
              placeholder="Catatan opsional untuk siswa ini..."
            />
          </div>
        </div>

        <div class="border-t bg-background px-5 py-4">
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              :disabled="saving"
              @click="handleOpenChange(false)"
            >
              Batal
            </Button>
            <Button type="submit" :disabled="saving">
              {{
                saving
                  ? "Menyimpan..."
                  : result
                    ? "Simpan Perubahan"
                    : "Submit Penilaian"
              }}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
