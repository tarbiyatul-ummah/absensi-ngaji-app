import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { LoadingState } from "@/components/ui/loading-state";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download05Icon,
  Copy01Icon,
  Edit01Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  PlusSignIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import type { InvoiceStatus, SppInvoiceRecord } from "@/types";
import { useTerms } from "@/config/organization";
import {
  formatMonthLabel,
  formatRupiah,
  formatShortDate,
  generateInvoiceWhatsAppMessage,
} from "@/utils/invoiceUtils";
import { generateInvoicePdf } from "@/services/invoicePdfService";
import { exportInvoiceAsImage } from "@/services/invoiceImageService";
import { FileImage } from "lucide-react";
import {
  deleteInvoice,
  getInvoices,
  updateInvoiceStatus,
} from "@/services/invoiceService";

interface InvoiceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditInvoice: (record: SppInvoiceRecord) => void;
  onCreateNewInvoice: () => void;
  onPaymentsUpdated?: () => void; // Triggered when status changed to 'paid' so parent reloads SPP
}

export const InvoiceListDialog: React.FC<InvoiceListDialogProps> = ({
  open,
  onOpenChange,
  onEditInvoice,
  onCreateNewInvoice,
  onPaymentsUpdated,
}) => {
  const terms = useTerms();
  const [invoices, setInvoices] = useState<SppInvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const records = await getInvoices();
      setInvoices(records);
    } catch (err: any) {
      setFeedbackMessage("Gagal memuat daftar invoice dari server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      // Filter status
      if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false;
      }
      if (!q) return true;

      // Filter query
      const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
      const recipientMatch = (inv.recipientName || "").toLowerCase().includes(q);
      const studentMatch = (inv.data?.students || []).some((s) =>
        s.santriNama.toLowerCase().includes(q),
      );

      return numMatch || recipientMatch || studentMatch;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Handle Ubah Status (Otomatis Sync ke SPP)
  const handleToggleStatus = async (
    record: SppInvoiceRecord,
    nextStatus: InvoiceStatus,
  ) => {
    setActionLoadingId(record.id);
    setFeedbackMessage(null);
    try {
      const updated = await updateInvoiceStatus(record.id, nextStatus, record);
      setInvoices((prev) =>
        prev.map((item) => (item.id === record.id ? updated : item)),
      );

      if (nextStatus === "paid") {
        setFeedbackMessage(
          `Invoice ${record.invoiceNumber} berhasil ditandai LUNAS dan pembayaran SPP otomatis diperbarui!`,
        );
      } else {
        setFeedbackMessage(
          `Status invoice ${record.invoiceNumber} berhasil diubah.`,
        );
      }

      onPaymentsUpdated?.();
    } catch (err: any) {
      setFeedbackMessage(err?.message || "Gagal mengubah status invoice.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Unduh PDF
  const handleDownloadPdf = async (record: SppInvoiceRecord) => {
    setActionLoadingId(record.id);
    try {
      await generateInvoicePdf(record.data);
    } catch {
      setFeedbackMessage("Gagal membuat file PDF invoice.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Unduh Gambar (PNG)
  const handleDownloadImage = async (record: SppInvoiceRecord) => {
    setActionLoadingId(record.id);
    try {
      await exportInvoiceAsImage(record.data, record.status);
    } catch {
      setFeedbackMessage("Gagal membuat file gambar invoice.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Salin WA
  const handleCopyWa = async (record: SppInvoiceRecord) => {
    try {
      const text = generateInvoiceWhatsAppMessage(
        record.data,
        terms.paymentLabel,
      );
      await navigator.clipboard.writeText(text);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setFeedbackMessage("Gagal menyalin teks ke clipboard.");
    }
  };

  // Handle Hapus
  const handleDelete = async (record: SppInvoiceRecord) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus invoice ${record.invoiceNumber}?`,
      )
    ) {
      return;
    }

    setActionLoadingId(record.id);
    try {
      await deleteInvoice(record.id);
      setInvoices((prev) => prev.filter((i) => i.id !== record.id));
      setFeedbackMessage(`Invoice ${record.invoiceNumber} berhasil dihapus.`);
    } catch (err: any) {
      setFeedbackMessage(err?.message || "Gagal menghapus invoice.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Lunas</Badge>;
      case "cancelled":
        return <Badge variant="neutral">Dibatalkan</Badge>;
      default:
        return <Badge variant="danger">Belum Bayar</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b shrink-0 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <HugeiconsIcon icon={Invoice01Icon} size={20} className="text-primary" />
                Daftar Invoice & Riwayat Tagihan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kelola status pembayaran invoice dan pantau tagihan yang telah dikirim ke orang tua.
              </DialogDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onCreateNewInvoice();
              }}
              className="gap-1.5 text-xs w-full sm:w-auto"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              Buat Invoice Baru
            </Button>
          </div>
        </DialogHeader>

        {feedbackMessage && (
          <div className="bg-primary/10 text-foreground text-xs px-4 py-2 border-b flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-4 border-b bg-muted/10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari no. invoice, nama santri, atau nama penerima..."
            className="h-8 text-xs"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Semua ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "unpaid"
                  ? "bg-danger text-danger-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Belum Bayar ({invoices.filter((i) => i.status === "unpaid").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("paid")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "paid"
                  ? "bg-success text-success-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Lunas ({invoices.filter((i) => i.status === "paid").length})
            </button>
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <LoadingState size="md" text="Memuat daftar invoice..." />
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <p className="font-semibold text-sm text-foreground mb-1">
                Tidak ada invoice yang ditemukan
              </p>
              <p>
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter status Anda."
                  : "Belum ada invoice yang dibuat. Klik tombol 'Buat Invoice Baru' di atas."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((inv) => {
                const students = inv.data?.students || [];
                const isItemLoading = actionLoadingId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="rounded-lg border bg-background p-4 shadow-2xs hover:border-primary/40 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {inv.invoiceNumber}
                        </span>
                        {getStatusBadge(inv.status)}
                        {inv.issuedDate && (
                          <span className="text-[11px] text-muted-foreground">
                            • {formatShortDate(inv.issuedDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Total Tagihan:</span>
                        <strong className="text-sm font-bold text-primary font-mono">
                          {formatRupiah(inv.totalAmount)}
                        </strong>
                      </div>
                    </div>

                    {/* Penerima & Santri */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Kepada Yth:
                        </span>
                        <span className="font-medium text-foreground">
                          {inv.recipientName || "Wali Santri"}
                        </span>
                        {inv.dueDate && (
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            Jatuh tempo: {formatShortDate(inv.dueDate)}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Siswa & Bulan yang Ditagihkan ({students.length} Siswa):
                        </span>
                        <div className="space-y-1 mt-1">
                          {students.map((st) => (
                            <div key={st.santriId} className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-foreground">
                                {st.santriNama}:
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                {st.months.map(formatMonthLabel).join(", ")}
                              </span>
                              <span className="font-mono text-[10px] text-primary/80">
                                ({formatRupiah(st.subtotal)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar per Item */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                      {/* Status changer buttons */}
                      <div className="flex items-center gap-1.5">
                        {inv.status !== "paid" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={isItemLoading}
                            onClick={() => handleToggleStatus(inv, "paid")}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            title="Tandai sudah dibayar (Otomatis mengubah SPP siswa menjadi lunas)"
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                            Tandai Lunas
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isItemLoading}
                            onClick={() => handleToggleStatus(inv, "unpaid")}
                            className="h-7 text-xs text-muted-foreground hover:text-danger gap-1"
                            title="Batalkan status lunas"
                          >
                            <HugeiconsIcon icon={CancelCircleIcon} size={14} />
                            Batal Lunas
                          </Button>
                        )}

                        {inv.status !== "cancelled" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isItemLoading}
                            onClick={() => handleToggleStatus(inv, "cancelled")}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Batalkan Tagihan
                          </Button>
                        )}
                      </div>

                      {/* Utility buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isItemLoading}
                          onClick={() => handleCopyWa(inv)}
                          className="h-7 text-xs gap-1"
                          title="Salin ringkasan pesan WhatsApp"
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={13} />
                          {copiedId === inv.id ? "Tersalin!" : "WA"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isItemLoading}
                          onClick={() => handleDownloadPdf(inv)}
                          className="h-7 text-xs gap-1"
                          title="Unduh PDF invoice"
                        >
                          <HugeiconsIcon icon={Download05Icon} size={13} />
                          PDF
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isItemLoading}
                          onClick={() => handleDownloadImage(inv)}
                          className="h-7 text-xs gap-1"
                          title="Unduh gambar invoice (PNG)"
                        >
                          <FileImage size={13} />
                          Gambar
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isItemLoading}
                          onClick={() => {
                            onOpenChange(false);
                            onEditInvoice(inv);
                          }}
                          className="h-7 text-xs gap-1"
                          title="Edit isi invoice"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={13} />
                          Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isItemLoading}
                          onClick={() => handleDelete(inv)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 p-1.5"
                          title="Hapus invoice dari database"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceListDialog;

