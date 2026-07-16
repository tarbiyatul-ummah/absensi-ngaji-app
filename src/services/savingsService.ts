import { getCurrentUserId, supabase } from "./supabase";
import type {
  SavingsAccount,
  SavingsAccountFormData,
  SavingsPayment,
} from "../types";

const ACCOUNTS_TABLE = "savings_accounts";
const PAYMENTS_TABLE = "savings_payments";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapSavingsAccount = (row: any): SavingsAccount => ({
  id: row.id,
  name: row.name,
  academicYearStart: row.academic_year_start,
  semester: row.semester,
  mode: row.mode,
  santriIds: row.santri_ids ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSavingsPayment = (row: any): SavingsPayment => ({
  id: row.id,
  savingsAccountId: row.savings_account_id,
  santriId: row.santri_id,
  academicYearStart: row.academic_year_start,
  semester: row.semester,
  month: row.month,
  isPaid: row.is_paid,
  paidAt: row.paid_at ?? null,
  updatedAt: row.updated_at,
});

export const getSavingsAccounts = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .select(
      "id,name,academic_year_start,semester,mode,santri_ids,created_at,updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapSavingsAccount);
};

export const getSavingsAccountById = async (accountId: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .select(
      "id,name,academic_year_start,semester,mode,santri_ids,created_at,updated_at",
    )
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  throwIfError(error);
  return data ? mapSavingsAccount(data) : null;
};

export const getSavingsAccountsByAcademicYear = async (
  academicYearStart: number,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .select(
      "id,name,academic_year_start,semester,mode,santri_ids,created_at,updated_at",
    )
    .eq("user_id", userId)
    .eq("academic_year_start", academicYearStart)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapSavingsAccount);
};

export const addSavingsAccount = async (data: SavingsAccountFormData) => {
  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const { data: insertedRows, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .insert({
      user_id: userId,
      name: data.name,
      academic_year_start: data.academicYearStart,
      semester: data.semester,
      mode: data.mode,
      santri_ids: data.santriIds,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("id")
    .single();

  throwIfError(error);
  if (!insertedRows) throw new Error("Gagal membuat tabungan.");

  return insertedRows.id as string;
};

export const updateSavingsAccount = async (
  accountId: string,
  data: SavingsAccountFormData,
) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(ACCOUNTS_TABLE)
    .update({
      name: data.name,
      academic_year_start: data.academicYearStart,
      semester: data.semester,
      mode: data.mode,
      santri_ids: data.santriIds,
      updated_at: Date.now(),
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  throwIfError(error);
};

export const deleteSavingsAccount = async (accountId: string) => {
  const userId = await getCurrentUserId();
  const paymentsDelete = await supabase
    .from(PAYMENTS_TABLE)
    .delete()
    .eq("savings_account_id", accountId)
    .eq("user_id", userId);
  const accountDelete = await supabase
    .from(ACCOUNTS_TABLE)
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  throwIfError(paymentsDelete.error);
  throwIfError(accountDelete.error);
};

export const getSavingsPaymentId = (
  savingsAccountId: string,
  month: string,
  santriId: string,
) => `${savingsAccountId}_${month}_${santriId}`;

export const getSavingsPaymentsByAccount = async (
  savingsAccountId: string,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select(
      "id,savings_account_id,santri_id,academic_year_start,semester,month,is_paid,paid_at,updated_at",
    )
    .eq("user_id", userId)
    .eq("savings_account_id", savingsAccountId);

  throwIfError(error);
  return (data ?? []).map(mapSavingsPayment);
};

export const saveSavingsPayment = async (
  data: Omit<SavingsPayment, "id" | "updatedAt">,
) => {
  const userId = await getCurrentUserId();
  const id = getSavingsPaymentId(
    data.savingsAccountId,
    data.month,
    data.santriId,
  );
  const { error } = await supabase.from(PAYMENTS_TABLE).upsert(
    {
      id,
      user_id: userId,
      savings_account_id: data.savingsAccountId,
      santri_id: data.santriId,
      academic_year_start: data.academicYearStart,
      semester: data.semester,
      month: data.month,
      is_paid: data.isPaid,
      paid_at: data.paidAt ?? null,
      updated_at: Date.now(),
    },
    { onConflict: "id" },
  );

  throwIfError(error);
};
