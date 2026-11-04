import type { AssessmentItemType } from "../types";

export interface QualitativeGrade {
  score: number;
  grade: string;
  desc: string;
  fullLabel: string;
}

export const QUALITATIVE_GRADES: readonly QualitativeGrade[] = [
  { score: 4, grade: "A", desc: "Sangat Baik", fullLabel: "A (Sangat Baik)" },
  { score: 3, grade: "B", desc: "Baik", fullLabel: "B (Baik)" },
  { score: 2, grade: "C", desc: "Cukup", fullLabel: "C (Cukup)" },
  { score: 1, grade: "D", desc: "Kurang", fullLabel: "D (Kurang)" },
] as const;

export const getQualitativeGrade = (score: number): string => {
  if (score >= 3.5) return "A";
  if (score >= 2.5) return "B";
  if (score >= 1.5) return "C";
  if (score >= 0.5) return "D";
  return "-";
};

export const getQualitativeLabel = (score: number): string => {
  if (score >= 3.5) return "A (Sangat Baik)";
  if (score >= 2.5) return "B (Baik)";
  if (score >= 1.5) return "C (Cukup)";
  if (score >= 0.5) return "D (Kurang)";
  return "-";
};

export const getScoreDisplay = (
  score: number,
  maxScore: number,
  type?: AssessmentItemType
): string => {
  if (type === "qualitative" || maxScore === 4) {
    return getQualitativeLabel(score);
  }
  return `${score}/${maxScore}`;
};

export const getAssessmentTypeLabel = (type: AssessmentItemType): string => {
  switch (type) {
    case "qualitative":
      return "Kualitatif (A, B, C, D)";
    case "scale":
      return "Skala Rating (1-5)";
    case "score":
    default:
      return "Nilai Angka (0-100)";
  }
};

