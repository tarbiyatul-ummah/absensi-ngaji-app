import type { InvoiceData } from "../types";

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMonthLabel = (monthValue: string): string => {
  if (!monthValue) return "-";
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (Number.isNaN(year) || Number.isNaN(month)) return monthValue;

  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
};

export const formatShortDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV/${year}${month}${day}/${randomPart}`;
};

export const getAcademicYearStartForMonth = (monthValue: string): number => {
  const [y, m] = monthValue.split("-").map(Number);
  if (!y || !m) return new Date().getFullYear();
  return m >= 7 ? y : y - 1;
};

export const generateInvoiceWhatsAppMessage = (
  invoice: InvoiceData,
  paymentLabel = "SPP",
): string => {
  const header = invoice.header;
  const lines: string[] = [];

  // Header Title
  lines.push(`*${(header.title || `INVOICE TAGIHAN ${paymentLabel}`).toUpperCase()}*`);
  if (header.organizationName) {
    lines.push(`*${header.organizationName}*`);
  }
  if (header.address || header.phone) {
    const sub = [header.address, header.phone ? `WA: ${header.phone}` : ""].filter(Boolean).join(" | ");
    lines.push(`_${sub}_`);
  }
  lines.push("");

  // Metadata
  lines.push(`📄 *No. Invoice:* ${invoice.invoiceNumber}`);
  if (invoice.issuedDate) {
    lines.push(`📅 *Tanggal:* ${formatShortDate(invoice.issuedDate)}`);
  }
  if (invoice.dueDate) {
    lines.push(`⏳ *Jatuh Tempo:* ${formatShortDate(invoice.dueDate)}`);
  }
  if (invoice.recipientName?.trim()) {
    lines.push(`👤 *Kepada Yth:* ${invoice.recipientName.trim()}`);
  }
  lines.push("");

  // Rincian Siswa
  lines.push(`📋 *RINCIAN TAGIHAN ${paymentLabel.toUpperCase()}:*`);
  invoice.students.forEach((student, index) => {
    lines.push(`${index + 1}. *${student.santriNama}* (${student.jilidNama || "Santri"})`);
    const monthNames = student.months.map(formatMonthLabel).join(", ");
    lines.push(`   • Bulan: ${monthNames || "-"} (${student.months.length} bulan)`);
    lines.push(`   • Tarif: ${formatRupiah(student.monthlyFee)}/bulan`);
    lines.push(`   • Subtotal: *${formatRupiah(student.subtotal)}*`);
  });

  // Adjustments (Diskon / Tambahan)
  if (invoice.adjustments && invoice.adjustments.length > 0) {
    lines.push("");
    lines.push(`➕ *Penyesuaian / Keringanan:*`);
    invoice.adjustments.forEach((adj) => {
      const sign = adj.amount < 0 ? "-" : "+";
      const displayAmount = formatRupiah(Math.abs(adj.amount));
      lines.push(`   • ${adj.label}: ${sign}${displayAmount}`);
    });
  }

  // Grand Total
  lines.push("");
  lines.push(`══════════════════════════`);
  lines.push(`💰 *TOTAL HARUS DIBAYAR: ${formatRupiah(invoice.grandTotal)}*`);
  lines.push(`══════════════════════════`);
  lines.push("");

  // Payment Details
  if (invoice.bankName || invoice.bankAccountNumber) {
    lines.push(`💳 *PEMBAYARAN DAPAT DITRANSFER KE:*`);
    if (invoice.bankName) {
      lines.push(`• Bank/E-Wallet: *${invoice.bankName}*`);
    }
    if (invoice.bankAccountNumber) {
      lines.push(`• No. Rekening: *${invoice.bankAccountNumber}*`);
    }
    if (invoice.bankAccountHolder) {
      lines.push(`• Atas Nama: *${invoice.bankAccountHolder}*`);
    }
    lines.push("");
  }

  // Notes
  if (invoice.notes?.trim()) {
    lines.push(`📌 *Catatan:*`);
    lines.push(invoice.notes.trim());
    lines.push("");
  }

  lines.push(`_Terima kasih atas perhatian dan kerja samanya._ 🙏`);

  return lines.join("\n");
};

