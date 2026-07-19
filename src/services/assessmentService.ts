import { getCurrentUserId, supabase } from "./supabase";
import type {
  Assessment,
  AssessmentFormData,
  AssessmentItem,
  AssessmentItemType,
  AssessmentParticipant,
  AssessmentResult,
  AssessmentScore,
} from "../types";

const ASSESSMENTS_TABLE = "assessments";
const ITEMS_TABLE = "assessment_items";
const PARTICIPANTS_TABLE = "assessment_participants";
const RESULTS_TABLE = "assessment_results";
const SCORES_TABLE = "assessment_scores";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const withErrorContext = async <T>(
  context: string,
  action: () => Promise<T>,
) => {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error tidak diketahui.";
    throw new Error(`${context}: ${message}`);
  }
};

const maxScoreByType = (type: AssessmentItemType) =>
  type === "scale" ? 5 : 100;

const mapItem = (row: any): AssessmentItem => ({
  id: row.id,
  assessmentId: row.assessment_id,
  label: row.label,
  assessmentType: row.assessment_type,
  maxScore: Number(row.max_score ?? 100),
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapParticipant = (row: any): AssessmentParticipant => ({
  id: row.id,
  assessmentId: row.assessment_id,
  santriId: row.santri_id,
  createdAt: row.created_at,
});

const mapScore = (row: any): AssessmentScore => ({
  id: row.id,
  assessmentId: row.assessment_id,
  santriId: row.santri_id,
  assessmentItemId: row.assessment_item_id,
  score: Number(row.score ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapResult = (row: any, scores: AssessmentScore[]): AssessmentResult => ({
  id: row.id,
  assessmentId: row.assessment_id,
  santriId: row.santri_id,
  notes: row.notes ?? undefined,
  submittedAt: row.submitted_at,
  updatedAt: row.updated_at,
  scores,
});

const mapAssessment = (
  row: any,
  scoresByResultKey: Map<string, AssessmentScore[]>,
): Assessment => ({
  id: row.id,
  name: row.name,
  assessmentType: row.assessment_type ?? "score",
  minimumScore: Number(row.minimum_score ?? 0),
  isArchived: row.is_archived,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: (row.assessment_items ?? [])
    .map(mapItem)
    .sort((a: AssessmentItem, b: AssessmentItem) => a.sortOrder - b.sortOrder),
  participants: (row.assessment_participants ?? []).map(mapParticipant),
  results: (row.assessment_results ?? []).map((result: any) =>
    mapResult(
      result,
      scoresByResultKey.get(`${result.assessment_id}_${result.santri_id}`) ??
        [],
    ),
  ),
});

export const getAssessments = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(ASSESSMENTS_TABLE)
    .select(
      `
      id,name,assessment_type,minimum_score,is_archived,created_at,updated_at,
      assessment_items(id,assessment_id,label,assessment_type,max_score,sort_order,created_at,updated_at),
      assessment_participants(id,assessment_id,santri_id,created_at),
      assessment_results(id,assessment_id,santri_id,notes,submitted_at,updated_at)
    `,
    )
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  throwIfError(error);

  const assessmentIds = (data ?? []).map((row) => row.id as string);
  if (assessmentIds.length === 0) return [];

  const scoresResponse = await supabase
    .from(SCORES_TABLE)
    .select(
      "id,assessment_id,santri_id,assessment_item_id,score,created_at,updated_at",
    )
    .eq("user_id", userId)
    .in("assessment_id", assessmentIds);

  throwIfError(scoresResponse.error);

  const scoresByResultKey = (scoresResponse.data ?? []).reduce(
    (acc, row) => {
      const score = mapScore(row);
      const key = `${score.assessmentId}_${score.santriId}`;
      const scores = acc.get(key) ?? [];

      scores.push(score);
      acc.set(key, scores);
      return acc;
    },
    new Map<string, AssessmentScore[]>(),
  );

  return (data ?? []).map((row) => mapAssessment(row, scoresByResultKey));
};

export const addAssessment = async (formData: AssessmentFormData) => {
  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const { data, error } = await supabase
    .from(ASSESSMENTS_TABLE)
    .insert({
      user_id: userId,
      name: formData.name,
      assessment_type: formData.assessmentType,
      minimum_score: formData.minimumScore,
      is_archived: false,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("id")
    .single();

  throwIfError(error);
  if (!data) throw new Error("Penilaian gagal dibuat.");

  const assessmentId = data.id as string;
  await withErrorContext("Butir penilaian gagal disimpan", () =>
    replaceAssessmentItems(
      assessmentId,
      formData.items,
      formData.assessmentType,
    ),
  );
  await withErrorContext("Peserta penilaian gagal disimpan", () =>
    syncAssessmentParticipants(assessmentId, formData.santriIds),
  );

  return assessmentId;
};

export const updateAssessment = async (
  assessmentId: string,
  formData: AssessmentFormData,
) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(ASSESSMENTS_TABLE)
    .update({
      name: formData.name,
      assessment_type: formData.assessmentType,
      minimum_score: formData.minimumScore,
      updated_at: Date.now(),
    })
    .eq("id", assessmentId)
    .eq("user_id", userId);

  throwIfError(error);
  await withErrorContext("Butir penilaian gagal disimpan", () =>
    replaceAssessmentItems(
      assessmentId,
      formData.items,
      formData.assessmentType,
    ),
  );
  await withErrorContext("Peserta penilaian gagal disimpan", () =>
    syncAssessmentParticipants(assessmentId, formData.santriIds),
  );
};

export const deleteAssessment = async (assessmentId: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(ASSESSMENTS_TABLE)
    .update({ is_archived: true, updated_at: Date.now() })
    .eq("id", assessmentId)
    .eq("user_id", userId);

  throwIfError(error);
};

const replaceAssessmentItems = async (
  assessmentId: string,
  items: AssessmentFormData["items"],
  assessmentType: AssessmentItemType,
) => {
  const userId = await getCurrentUserId();
  const existingItemIds = items
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));

  if (existingItemIds.length > 0) {
    const { error } = await supabase
      .from(ITEMS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .not("id", "in", `(${existingItemIds.join(",")})`);

    throwIfError(error);
  } else {
    const { error } = await supabase
      .from(ITEMS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId);

    throwIfError(error);
  }

  await Promise.all(
    items.map(async (item, index) => {
      const payload = {
        user_id: userId,
        assessment_id: assessmentId,
        label: item.label,
        assessment_type: assessmentType,
        max_score: maxScoreByType(assessmentType),
        sort_order: index,
        updated_at: Date.now(),
      };

      if (item.id) {
        const { error } = await supabase
          .from(ITEMS_TABLE)
          .update(payload)
          .eq("id", item.id)
          .eq("user_id", userId);

        throwIfError(error);
        return;
      }

      const { error } = await supabase.from(ITEMS_TABLE).insert({
        ...payload,
        created_at: Date.now(),
      });

      throwIfError(error);
    }),
  );
};

const syncAssessmentParticipants = async (
  assessmentId: string,
  santriIds: string[],
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(PARTICIPANTS_TABLE)
    .select("santri_id")
    .eq("user_id", userId)
    .eq("assessment_id", assessmentId);

  throwIfError(error);

  const existingIds = new Set((data ?? []).map((row) => row.santri_id));
  const nextIds = new Set(santriIds);
  const removedIds = [...existingIds].filter((santriId) => !nextIds.has(santriId));
  const addedIds = santriIds.filter((santriId) => !existingIds.has(santriId));

  if (removedIds.length > 0) {
    const participantsDelete = await supabase
      .from(PARTICIPANTS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .in("santri_id", removedIds);
    const resultsDelete = await supabase
      .from(RESULTS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .in("santri_id", removedIds);
    const scoresDelete = await supabase
      .from(SCORES_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .in("santri_id", removedIds);

    throwIfError(participantsDelete.error);
    throwIfError(resultsDelete.error);
    throwIfError(scoresDelete.error);
  }

  if (addedIds.length > 0) {
    const { error: insertError } = await supabase
      .from(PARTICIPANTS_TABLE)
      .insert(
        addedIds.map((santriId) => ({
          user_id: userId,
          assessment_id: assessmentId,
          santri_id: santriId,
          created_at: Date.now(),
        })),
      );

    throwIfError(insertError);
  }
};

export const saveAssessmentResult = async (data: {
  assessmentId: string;
  santriId: string;
  notes?: string;
  scores: { assessmentItemId: string; score: number }[];
}) => {
  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const resultUpsert = await supabase.from(RESULTS_TABLE).upsert(
    {
      user_id: userId,
      assessment_id: data.assessmentId,
      santri_id: data.santriId,
      notes: data.notes?.trim() || null,
      submitted_at: timestamp,
      updated_at: timestamp,
    },
    { onConflict: "assessment_id,santri_id" },
  );

  throwIfError(resultUpsert.error);

  const scoreRows = data.scores.map((score) => ({
    user_id: userId,
    assessment_id: data.assessmentId,
    santri_id: data.santriId,
    assessment_item_id: score.assessmentItemId,
    score: score.score,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  if (scoreRows.length === 0) return;

  const scoresUpsert = await supabase.from(SCORES_TABLE).upsert(scoreRows, {
    onConflict: "assessment_id,santri_id,assessment_item_id",
  });

  throwIfError(scoresUpsert.error);
};
