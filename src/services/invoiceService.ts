import { getCurrentUserId, supabase } from "./supabase";
import type { InvoiceStatus, SppInvoiceRecord } from "../types";
import { saveSppPaymentsBatch } from "./financeService";
import { getAcademicYearStartForMonth } from "../utils/invoiceUtils";

const TABLE = "spp_invoices";

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapInvoiceRecord = (row: any): SppInvoiceRecord => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  issuedDate: row.issued_date,
  dueDate: row.due_date ?? null,
  recipientName: row.recipient_name ?? null,
  status: row.status as InvoiceStatus,
  totalAmount: Number(row.total_amount) || 0,
  data: row.data,
  paidAt: row.paid_at ?? null,
  createdAt: Number(row.created_at) || Date.now(),
  updatedAt: Number(row.updated_at) || Date.now(),
});

export const getInvoices = async (): Promise<SppInvoiceRecord[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,invoice_number,issued_date,due_date,recipient_name,status,total_amount,data,paid_at,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapInvoiceRecord);
};

export const getInvoiceById = async (id: string): Promise<SppInvoiceRecord | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,invoice_number,issued_date,due_date,recipient_name,status,total_amount,data,paid_at,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  throwIfError(error);
  if (!data) return null;
  return mapInvoiceRecord(data);
};

export const saveInvoice = async (record: SppInvoiceRecord): Promise<void> => {
  const userId = await getCurrentUserId();
  const now = Date.now();

  const payload = {
    id: record.id,
    user_id: userId,
    invoice_number: record.invoiceNumber,
    issued_date: record.issuedDate,
    due_date: record.dueDate ?? null,
    recipient_name: record.recipientName ?? null,
    status: record.status,
    total_amount: record.totalAmount,
    data: record.data,
    paid_at: record.paidAt ?? null,
    created_at: record.createdAt || now,
    updated_at: now,
  };

  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "id" });

  throwIfError(error);

  // Jika disimpan langsung dengan status paid, otomatis sync status pembayaran
  if (record.status === "paid") {
    await syncSppPaymentsFromInvoice(record, true);
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

export const syncSppPaymentsFromInvoice = async (
  record: SppInvoiceRecord,
  isPaid: boolean,
): Promise<void> => {
  const payments: Array<{
    santriId: string;
    academicYearStart: number;
    month: string;
    isPaid: boolean;
    paidAt?: number | null;
  }> = [];

  const now = Date.now();
  record.data.students.forEach((student) => {
    student.months.forEach((month) => {
      payments.push({
        santriId: student.santriId,
        month,
        academicYearStart: getAcademicYearStartForMonth(month),
        isPaid,
        paidAt: isPaid ? (record.paidAt ?? now) : null,
      });
    });
  });

  if (payments.length > 0) {
    await saveSppPaymentsBatch(payments);
  }
};

export const updateInvoiceStatus = async (
  id: string,
  newStatus: InvoiceStatus,
  existingRecord?: SppInvoiceRecord,
): Promise<SppInvoiceRecord> => {
  const userId = await getCurrentUserId();
  const record = existingRecord ?? (await getInvoiceById(id));
  if (!record) {
    throw new Error("Invoice tidak ditemukan.");
  }

  const now = Date.now();
  const wasPaid = record.status === "paid";
  const isNowPaid = newStatus === "paid";
  const paidAt = isNowPaid ? (record.paidAt ?? now) : null;

  const { error } = await supabase
    .from(TABLE)
    .update({
      status: newStatus,
      paid_at: paidAt,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);

  const updatedRecord: SppInvoiceRecord = {
    ...record,
    status: newStatus,
    paidAt,
    updatedAt: now,
  };

  // Otomatisasi: Jika status berubah jadi 'paid', tandai SPP lunas
  if (isNowPaid && !wasPaid) {
    await syncSppPaymentsFromInvoice(updatedRecord, true);
  } else if (!isNowPaid && wasPaid) {
    // Jika status diubah dari paid kembali ke unpaid/cancelled, batalkan status lunas SPP
    await syncSppPaymentsFromInvoice(updatedRecord, false);
  }

  return updatedRecord;
};

