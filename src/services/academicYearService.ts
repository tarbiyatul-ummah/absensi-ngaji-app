import { getCurrentUserId, supabase } from "./supabase";
import type { AcademicYear } from "../types";
import {
  getAcademicYearLabel,
  getAcademicYearOptions,
  getCurrentAcademicYearStart,
} from "../utils/academicPeriod";

const TABLE = "academic_years";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapAcademicYear = (row: any): AcademicYear => ({
  id: row.id,
  startYear: row.start_year,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getAcademicYearSelectOptions = (
  academicYears: AcademicYear[],
  fallbackStartYear = getCurrentAcademicYearStart(),
) => {
  if (academicYears.length === 0) {
    return getAcademicYearOptions(fallbackStartYear);
  }

  return academicYears
    .slice()
    .sort((a, b) => b.startYear - a.startYear)
    .map((year) => ({
      startYear: year.startYear,
      label: getAcademicYearLabel(year.startYear),
    }));
};

export const getDefaultAcademicYearStart = (
  academicYears: AcademicYear[],
  fallbackStartYear = getCurrentAcademicYearStart(),
) =>
  academicYears.find((year) => year.isActive)?.startYear ??
  academicYears
    .slice()
    .sort((a, b) => b.startYear - a.startYear)[0]?.startYear ??
  fallbackStartYear;

export const getAcademicYears = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,start_year,is_active,created_at,updated_at")
    .eq("user_id", userId)
    .order("start_year", { ascending: false });

  throwIfError(error);

  return (data ?? []).map(mapAcademicYear);
};

export const createAcademicYear = async (startYear: number) => {
  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const existingResponse = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  throwIfError(existingResponse.error);

  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    start_year: startYear,
    is_active: (existingResponse.count ?? 0) === 0,
    created_at: timestamp,
    updated_at: timestamp,
  });

  throwIfError(error);
};

export const updateAcademicYear = async (
  academicYearId: string,
  startYear: number,
) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLE)
    .update({
      start_year: startYear,
      updated_at: Date.now(),
    })
    .eq("id", academicYearId)
    .eq("user_id", userId);

  throwIfError(error);
};

export const setActiveAcademicYear = async (academicYearId: string) => {
  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const resetResponse = await supabase
    .from(TABLE)
    .update({ is_active: false, updated_at: timestamp })
    .eq("user_id", userId);

  throwIfError(resetResponse.error);

  const activeResponse = await supabase
    .from(TABLE)
    .update({ is_active: true, updated_at: timestamp })
    .eq("id", academicYearId)
    .eq("user_id", userId);

  throwIfError(activeResponse.error);
};

export const deleteAcademicYear = async (academicYearId: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", academicYearId)
    .eq("user_id", userId);

  throwIfError(error);
};
