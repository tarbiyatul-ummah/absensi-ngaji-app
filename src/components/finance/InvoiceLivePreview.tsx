import React from "react";
import type { InvoiceData } from "../../types";
import { formatMonthLabel, formatRupiah, formatShortDate } from "../../utils/invoiceUtils";
import { Badge } from "@/components/ui/badge";

interface InvoiceLivePreviewProps {
  invoice: InvoiceData;
  status?: string;
}

export const InvoiceLivePreview: React.FC<InvoiceLivePreviewProps> = ({
  invoice,
  status = "unpaid",
}) => {
  const { header } = invoice;

  return (
    <div
      id="invoice-printable-area"
      className="rounded-xl border bg-white p-6 sm:p-8 text-slate-800 shadow-sm print:m-0 print:border-none print:p-0 print:shadow-none font-sans text-xs sm:text-sm"
    >
      {/* Header Section: Logo & Sender (Left) vs INVOICE Title & Balance Due (Right) */}
      <div className="flex flex-col sm:flex-row items-start justify-between border-b pb-5 gap-4">
        {/* Left: Lembaga & Bill To */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {header.showLogo && header.logoUrl && (
              <img
                src={header.logoUrl}
                alt="Logo"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-contain border p-1 bg-slate-50"
              />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {header.organizationName || "LPQ"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {[header.address, header.phone ? `Kontak/WA: ${header.phone}` : ""].filter(Boolean).join(" • ") ||
                  "Sistem Manajemen Santri"}
              </p>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Bill To:
            </span>
            <p className="text-sm font-bold text-slate-900">
              {invoice.recipientName?.trim() || "Wali Santri"}
            </p>
          </div>
        </div>

        {/* Right: INVOICE, Nomor, Tanggal & Balance Due Bar */}
        <div className="flex flex-col sm:items-end space-y-1.5 text-left sm:text-right w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              {header.title || "INVOICE"}
            </h3>
            <Badge
              variant={status === "paid" ? "success" : status === "cancelled" ? "danger" : "neutral"}
              className="uppercase tracking-wide text-[10px]"
            >
              {status === "paid" ? "Lunas" : status === "cancelled" ? "Dibatalkan" : "Belum Bayar"}
            </Badge>
          </div>
          <span className="font-mono text-xs text-slate-500 block">
            # {invoice.invoiceNumber}
          </span>
          <div className="text-[11px] text-slate-500 space-x-2">
            <span>Date: {formatShortDate(invoice.issuedDate)}</span>
            {invoice.dueDate && <span>• Due: {formatShortDate(invoice.dueDate)}</span>}
          </div>

          {/* Balance Due Highlight Box (Reference 1 style) */}
          <div className="mt-1 flex items-center justify-between sm:justify-end gap-3 rounded-lg bg-slate-100 border border-slate-200/90 px-3.5 py-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-700">
              Balance Due:
            </span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {formatRupiah(invoice.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Siswa & Bulan */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-white font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-8 text-center">No</th>
              <th className="py-2.5 px-3">Nama Santri</th>
              <th className="py-2.5 px-3 text-center">Kelas</th>
              <th className="py-2.5 px-3">Bulan Tagihan</th>
              <th className="py-2.5 px-3 text-right">Tarif</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.students.map((st, idx) => (
              <tr key={st.santriId} className="hover:bg-slate-50/60">
                <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                <td className="py-2 px-3 font-semibold text-slate-900">{st.santriNama}</td>
                <td className="py-2 px-3 text-center text-slate-600">{st.jilidNama || "-"}</td>
                <td className="py-2 px-3 text-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {st.months.map((m) => (
                      <span
                        key={m}
                        className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {formatMonthLabel(m)}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 self-center">
                      ({st.months.length} bln)
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right text-slate-600 font-mono text-[11px]">
                  {formatRupiah(st.monthlyFee)}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono text-[11px]">
                  {formatRupiah(st.subtotal)}
                </td>
              </tr>
            ))}

            {invoice.students.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                  Belum ada siswa yang dipilih.
                </td>
              </tr>
            )}

            {/* Adjustments */}
            {invoice.adjustments.map((adj) => (
              <tr key={adj.id} className="bg-amber-50/50 text-amber-900">
                <td className="py-1.5 px-3" />
                <td colSpan={4} className="py-1.5 px-3 text-right font-medium">
                  {adj.label}
                </td>
                <td className="py-1.5 px-3 text-right font-semibold font-mono text-[11px]">
                  {adj.amount < 0 ? "-" : "+"} {formatRupiah(Math.abs(adj.amount))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-bold">
            <tr>
              <td colSpan={5} className="py-3 px-3 text-right text-xs uppercase tracking-wide text-slate-700">
                Total Tagihan Harus Dibayar :
              </td>
              <td className="py-3 px-3 text-right text-sm text-primary font-mono font-black">
                {formatRupiah(invoice.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Informasi Pembayaran & Catatan */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs sm:order-last">
          <p className="font-bold text-slate-800 tracking-wide text-[11px] uppercase">
            Rekening Pembayaran:
          </p>
          <div className="mt-2 space-y-1 text-slate-700">
            {invoice.bankName && (
              <p>
                Bank/E-Wallet: <strong className="text-slate-900">{invoice.bankName}</strong>
              </p>
            )}
            {invoice.bankAccountNumber && (
              <p>
                No. Rekening:{" "}
                <strong className="text-slate-900 font-mono tracking-wider text-sm select-all">
                  {invoice.bankAccountNumber}
                </strong>
              </p>
            )}
            {invoice.bankAccountHolder && (
              <p>
                Atas Nama: <strong className="text-slate-900">{invoice.bankAccountHolder}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs flex flex-col justify-between">
          <div>
            <p className="font-bold text-slate-800 tracking-wide text-[11px] uppercase">
              Catatan:
            </p>
            <p className="mt-1 text-slate-600 leading-relaxed italic text-[11px]">
              {invoice.notes || "Silakan melakukan konfirmasi setelah transfer."}
            </p>
          </div>
          <div className="mt-4 text-right text-[11px] text-slate-500">
            Diterbitkan oleh: <strong className="text-slate-800">{header.organizationName}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceLivePreview;

