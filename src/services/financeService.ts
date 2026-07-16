import { getCurrentUserId, supabase } from "./supabase";
import type { SppPayment } from "../types";

const TABLE = "spp_payments";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapSppPayment = (row: any): SppPayment => ({
  id: row.id,
  santriId: row.santri_id,
  academicYearStart: row.academic_year_start,
  month: row.month,
  isPaid: row.is_paid,
  paidAt: row.paid_at ?? null,
  updatedAt: row.updated_at,
});

export const getSppPaymentId = (
  academicYearStart: number,
  month: string,
  santriId: string,
) => `${academicYearStart}_${month}_${santriId}`;

export const getSppPaymentsByAcademicYear = async (
  academicYearStart: number,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id,santri_id,academic_year_start,month,is_paid,paid_at,updated_at",
    )
    .eq("user_id", userId)
    .eq("academic_year_start", academicYearStart);

  throwIfError(error);
  return (data ?? []).map(mapSppPayment);
};

export const saveSppPayment = async (
  data: Omit<SppPayment, "id" | "updatedAt">,
) => {
  const userId = await getCurrentUserId();
  const id = getSppPaymentId(
    data.academicYearStart,
    data.month,
    data.santriId,
  );
  const { error } = await supabase.from(TABLE).upsert(
    {
      id,
      user_id: userId,
      santri_id: data.santriId,
      academic_year_start: data.academicYearStart,
      month: data.month,
      is_paid: data.isPaid,
      paid_at: data.paidAt ?? null,
      updated_at: Date.now(),
    },
    { onConflict: "id" },
  );

  throwIfError(error);
};
