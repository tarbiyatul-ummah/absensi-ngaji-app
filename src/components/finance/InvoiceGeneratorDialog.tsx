import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download05Icon,
  Copy01Icon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  EyeIcon,
  Edit01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import type {
  InvoiceAdjustment,
  InvoiceData,
  InvoiceStudentItem,
  Santri,
  SppInvoiceRecord,
} from "@/types";
import type { AcademicMonthOption } from "@/utils/academicPeriod";
import { organizationConfig, useTerms } from "@/config/organization";
import {
  formatMonthLabel,
  formatRupiah,
  generateInvoiceNumber,
  generateInvoiceWhatsAppMessage,
} from "@/utils/invoiceUtils";
import { generateInvoicePdf } from "@/services/invoicePdfService";
import { exportInvoiceAsImage } from "@/services/invoiceImageService";
import { saveInvoice } from "@/services/invoiceService";
import { InvoiceLivePreview } from "./InvoiceLivePreview";
import { FileImage } from "lucide-react";

interface InvoiceGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  santriList: Santri[];
  jilidMap: Map<string, string>;
  monthOptions: AcademicMonthOption[];
  isPaid: (santriId: string, month: string) => boolean;
  isMonthApplicable: (santri: Santri, month: string) => boolean;
  initialSantri?: Santri | null;
  initialInvoice?: SppInvoiceRecord | null;
  onSaved?: (savedRecord: SppInvoiceRecord) => void;
}

export const InvoiceGeneratorDialog: React.FC<InvoiceGeneratorDialogProps> = ({
  open,
  onOpenChange,
  santriList,
  jilidMap,
  monthOptions,
  isPaid,
  isMonthApplicable,
  initialSantri,
  initialInvoice,
  onSaved,
}) => {
  const terms = useTerms();

  // Tab view (Form / Preview)
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  // Header State
  const [headerTitle, setHeaderTitle] = useState(
    organizationConfig.invoiceTitle || "INVOICE TAGIHAN SPP",
  );
  const [orgName, setOrgName] = useState(organizationConfig.name || "LPQ");
  const [orgAddress, setOrgAddress] = useState(organizationConfig.address || "");
  const [orgPhone, setOrgPhone] = useState(organizationConfig.phone || "");
  const [showLogo, setShowLogo] = useState(true);

  // Meta State
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [issuedDate, setIssuedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<"unpaid" | "paid" | "cancelled">(
    "unpaid",
  );

  // Students & Items
  const [selectedStudents, setSelectedStudents] = useState<InvoiceStudentItem[]>(
    [],
  );
  const [adjustments, setAdjustments] = useState<InvoiceAdjustment[]>([]);

  // Adjustment Form
  const [adjLabel, setAdjLabel] = useState("");
  const [adjAmount, setAdjAmount] = useState<number | "">("");

  // Payment Details
  const [bankName, setBankName] = useState(organizationConfig.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    organizationConfig.bankAccountNumber || "",
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    organizationConfig.bankAccountHolder || "",
  );
  const [notes, setNotes] = useState(
    organizationConfig.paymentInstructions || "",
  );

  // Santri dropdown selector state
  const [santriSelectId, setSantriSelectId] = useState<string>("");

  // Operation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Active students lookup
  const activeSantriList = useMemo(
    () =>
      santriList
        .filter((s) => s.isActive !== false)
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [santriList],
  );

  const santriMap = useMemo(
    () => new Map(santriList.map((s) => [s.id, s])),
    [santriList],
  );

  // Helper untuk membuat item siswa otomatis dengan deteksi bulan belum lunas
  const createStudentItem = useCallback(
    (santri: Santri): InvoiceStudentItem => {
      const defaultFee = Number(organizationConfig.defaultMonthlyFee) || 50000;
      // Filter bulan yang belum lunas
      const unpaidMonths = monthOptions
        .filter(
          (m) =>
            isMonthApplicable(santri, m.value) && !isPaid(santri.id, m.value),
        )
        .map((m) => m.value);

      // Jika semua sudah lunas, fallback ke bulan pertama yang berlaku
      const months =
        unpaidMonths.length > 0
          ? unpaidMonths
          : monthOptions
              .filter((m) => isMonthApplicable(santri, m.value))
              .slice(0, 1)
              .map((m) => m.value);

      return {
        santriId: santri.id,
        santriNama: santri.nama,
        jilidNama: jilidMap.get(santri.jilidId) || "-",
        months,
        monthlyFee: defaultFee,
        subtotal: months.length * defaultFee,
      };
    },
    [monthOptions, isMonthApplicable, isPaid, jilidMap],
  );

  // Initialize or Reset dialog when opened
  useEffect(() => {
    if (!open) {
      setActiveTab("form");
      setFeedbackMessage(null);
      return;
    }

    if (initialInvoice) {
      // Mode Edit Invoice yang sudah ada
      setInvoiceId(initialInvoice.id);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setIssuedDate(initialInvoice.issuedDate);
      setDueDate(initialInvoice.dueDate || "");
      setRecipientName(initialInvoice.recipientName || "");
      setInvoiceStatus(initialInvoice.status);

      const d = initialInvoice.data;
      if (d) {
        setHeaderTitle(d.header?.title || "INVOICE TAGIHAN SPP");
        setOrgName(d.header?.organizationName || organizationConfig.name);
        setOrgAddress(d.header?.address ?? organizationConfig.address ?? "");
        setOrgPhone(d.header?.phone ?? organizationConfig.phone ?? "");
        setShowLogo(d.header?.showLogo !== false);
        setSelectedStudents(d.students || []);
        setAdjustments(d.adjustments || []);
        setBankName(d.bankName || "");
        setBankAccountNumber(d.bankAccountNumber || "");
        setBankAccountHolder(d.bankAccountHolder || "");
        setNotes(d.notes || "");
      }
    } else {
      // Mode Buat Invoice Baru
      const newId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setInvoiceId(newId);
      setInvoiceNumber(generateInvoiceNumber());
      setIssuedDate(new Date().toISOString().slice(0, 10));
      // Default due date: 7 hari ke depan
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 7);
      setDueDate(defaultDue.toISOString().slice(0, 10));
      setRecipientName("");
      setInvoiceStatus("unpaid");

      // Default configs
      setHeaderTitle(organizationConfig.invoiceTitle || `INVOICE TAGIHAN ${terms.paymentLabel}`);
      setOrgName(organizationConfig.name);
      setOrgAddress(organizationConfig.address || "");
      setOrgPhone(organizationConfig.phone || "");
      setShowLogo(true);
      setBankName(organizationConfig.bankName || "");
      setBankAccountNumber(organizationConfig.bankAccountNumber || "");
      setBankAccountHolder(organizationConfig.bankAccountHolder || "");
      setNotes(organizationConfig.paymentInstructions || "");
      setAdjustments([]);

      if (initialSantri) {
        setSelectedStudents([createStudentItem(initialSantri)]);
      } else {
        setSelectedStudents([]);
      }
    }
  }, [open, initialInvoice, initialSantri, createStudentItem, terms.paymentLabel]);

  // Handle Menambah Santri ke Invoice
  const handleAddStudent = (santriId: string) => {
    if (!santriId) return;
    if (selectedStudents.some((s) => s.santriId === santriId)) {
      setFeedbackMessage("Siswa ini sudah ada dalam daftar invoice.");
      return;
    }

    const santri = santriMap.get(santriId);
    if (!santri) return;

    setSelectedStudents((prev) => [...prev, createStudentItem(santri)]);
    setSantriSelectId("");
    setFeedbackMessage(null);
  };

  // Handle Hapus Siswa dari Invoice
  const handleRemoveStudent = (santriId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.santriId !== santriId));
  };

  // Handle Toggle Bulan per Siswa
  const handleToggleMonth = (santriId: string, monthValue: string) => {
    setSelectedStudents((prev) =>
      prev.map((student) => {
        if (student.santriId !== santriId) return student;

        const hasMonth = student.months.includes(monthValue);
        const nextMonths = hasMonth
          ? student.months.filter((m) => m !== monthValue)
          : [...student.months, monthValue].sort();

        return {
          ...student,
          months: nextMonths,
          subtotal: nextMonths.length * student.monthlyFee,
        };
      }),
    );
  };

  // Handle Ubah Tarif per Siswa
  const handleFeeChange = (santriId: string, newFee: number) => {
    const fee = Math.max(0, newFee);
    setSelectedStudents((prev) =>
      prev.map((student) => {
        if (student.santriId !== santriId) return student;
        return {
          ...student,
          monthlyFee: fee,
          subtotal: student.months.length * fee,
        };
      }),
    );
  };

  // Handle Tambah Diskon / Penyesuaian
  const handleAddAdjustment = () => {
    if (!adjLabel.trim() || adjAmount === "" || adjAmount === 0) return;
    const newAdj: InvoiceAdjustment = {
      id: `adj_${Date.now()}`,
      label: adjLabel.trim(),
      amount: Number(adjAmount),
    };
    setAdjustments((prev) => [...prev, newAdj]);
    setAdjLabel("");
    setAdjAmount("");
  };

  // Handle Hapus Penyesuaian
  const handleRemoveAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  // Kalkulasi Total
  const totalSpp = useMemo(
    () => selectedStudents.reduce((sum, s) => sum + s.subtotal, 0),
    [selectedStudents],
  );

  const totalAdjustments = useMemo(
    () => adjustments.reduce((sum, a) => sum + a.amount, 0),
    [adjustments],
  );

  const grandTotal = useMemo(
    () => Math.max(0, totalSpp + totalAdjustments),
    [totalSpp, totalAdjustments],
  );

  // Dokumen Invoice Lengkap
  const currentInvoiceData: InvoiceData = useMemo(() => {
    return {
      header: {
        title: headerTitle.trim() || `INVOICE TAGIHAN ${terms.paymentLabel}`,
        organizationName: orgName.trim() || organizationConfig.name,
        address: orgAddress.trim() || undefined,
        phone: orgPhone.trim() || undefined,
        showLogo,
        logoUrl: organizationConfig.faviconUrl,
      },
      invoiceNumber: invoiceNumber.trim() || generateInvoiceNumber(),
      issuedDate,
      dueDate: dueDate || undefined,
      recipientName: recipientName.trim() || undefined,
      students: selectedStudents,
      adjustments,
      totalSpp,
      totalAdjustments,
      grandTotal,
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim(),
      notes: notes.trim(),
    };
  }, [
    headerTitle,
    terms.paymentLabel,
    orgName,
    orgAddress,
    orgPhone,
    showLogo,
    invoiceNumber,
    issuedDate,
    dueDate,
    recipientName,
    selectedStudents,
    adjustments,
    totalSpp,
    totalAdjustments,
    grandTotal,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    notes,
  ]);

  // Simpan Invoice ke Database
  const handleSave = async (statusToSave?: "unpaid" | "paid" | "cancelled") => {
    if (selectedStudents.length === 0) {
      setFeedbackMessage("Pilih minimal 1 siswa untuk membuat invoice.");
      return;
    }

    const finalStatus = statusToSave ?? invoiceStatus;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const recordToSave: SppInvoiceRecord = {
        id: invoiceId,
        invoiceNumber: currentInvoiceData.invoiceNumber,
        issuedDate: currentInvoiceData.issuedDate,
        dueDate: currentInvoiceData.dueDate ?? null,
        recipientName: currentInvoiceData.recipientName ?? null,
        status: finalStatus,
        totalAmount: grandTotal,
        data: currentInvoiceData,
        paidAt: finalStatus === "paid" ? Date.now() : null,
        createdAt: initialInvoice?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await saveInvoice(recordToSave);
      setInvoiceStatus(finalStatus);
      onSaved?.(recordToSave);
      onOpenChange(false);
    } catch (err: any) {
      setFeedbackMessage(err?.message || "Gagal menyimpan invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unduh PDF
  const handleDownloadPdf = async () => {
    if (selectedStudents.length === 0) {
      setFeedbackMessage("Pilih minimal 1 siswa terlebih dahulu.");
      return;
    }

    setIsPdfLoading(true);
    setFeedbackMessage(null);
    try {
      await generateInvoicePdf(currentInvoiceData);
    } catch (err: any) {
      setFeedbackMessage("Gagal membuat file PDF. Silakan coba kembali.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Unduh Gambar (PNG)
  const handleDownloadImage = async () => {
    if (selectedStudents.length === 0) {
      setFeedbackMessage("Pilih minimal 1 siswa terlebih dahulu.");
      return;
    }

    setIsImageLoading(true);
    setFeedbackMessage(null);
    try {
      await exportInvoiceAsImage(currentInvoiceData, invoiceStatus);
    } catch {
      setFeedbackMessage("Gagal membuat gambar invoice. Silakan coba kembali.");
    } finally {
      setIsImageLoading(false);
    }
  };

  // Salin Teks WhatsApp
  const handleCopyWhatsApp = async () => {
    if (selectedStudents.length === 0) {
      setFeedbackMessage("Pilih minimal 1 siswa terlebih dahulu.");
      return;
    }

    try {
      const text = generateInvoiceWhatsAppMessage(
        currentInvoiceData,
        terms.paymentLabel,
      );
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedbackMessage("Gagal menyalin teks ke clipboard.");
    }
  };

  // Cetak Langsung
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b shrink-0 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {initialInvoice ? "Edit Invoice SPP" : "Buat Tagihan (Invoice SPP)"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Akomodasi multi-santri, multi-bulan, penyesuaian nominal, dan instruksi rekening transfer.
              </DialogDescription>
            </div>

            {/* Tab switch buttons */}
            <div className="flex items-center rounded-lg border bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === "form"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={Edit01Icon} size={14} />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={EyeIcon} size={14} />
                Pratinjau
              </button>
            </div>
          </div>
        </DialogHeader>

        {feedbackMessage && (
          <div className="bg-destructive/10 text-destructive text-xs px-4 py-2 border-b">
            {feedbackMessage}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "preview" ? (
            <div className="space-y-4">
              <InvoiceLivePreview invoice={currentInvoiceData} status={invoiceStatus} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bagian 1: Header Dokumen (Kustomisasi Kop) */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Header Dokumen & Kop Lembaga
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-xs">Judul Dokumen</Label>
                    <Input
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="Contoh: INVOICE TAGIHAN SPP"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nama Lembaga</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Nama Lembaga"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alamat Lembaga</Label>
                    <Input
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Jl. Melati No. 15, Surabaya"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Kontak / No. Telepon</Label>
                    <Input
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="0812-xxxx"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="show-logo-toggle"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <Label htmlFor="show-logo-toggle" className="text-xs cursor-pointer font-normal">
                    Tampilkan Logo Lembaga pada Invoice
                  </Label>
                </div>
              </div>

              {/* Bagian 2: Informasi Tagihan (Metadata) */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Informasi Tagihan & Penerima
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-1">
                    <Label className="text-xs">Nomor Invoice</Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tanggal Terbit</Label>
                    <Input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Jatuh Tempo</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nama Penerima / Orang Tua</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Contoh: Bpk. Hendra"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Daftar Siswa & Pilihan Bulan */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      3. Siswa & Bulan Tagihan ({selectedStudents.length} Siswa Terpilih)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Bulan yang belum lunas otomatis tercentang. Klik bulan untuk menambah/mengurangi.
                    </p>
                  </div>

                  {/* Dropdown Tambah Siswa */}
                  <div className="flex items-center gap-2 w-full sm:w-72">
                    <Select
                      value={santriSelectId}
                      onValueChange={(val) => {
                        handleAddStudent(val);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs w-full bg-background">
                        <SelectValue placeholder={`+ Tambah ${terms.studentSingularTitle}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSantriList.map((st) => (
                          <SelectItem
                            key={st.id}
                            value={st.id}
                            disabled={selectedStudents.some((s) => s.santriId === st.id)}
                          >
                            {st.nama} ({jilidMap.get(st.jilidId) || "-"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Kartu Daftar Siswa */}
                <div className="space-y-3">
                  {selectedStudents.map((st, idx) => {
                    const santriObj = santriMap.get(st.santriId);
                    return (
                      <div
                        key={st.santriId}
                        className="rounded-lg border bg-background p-3.5 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3 border-b pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                {idx + 1}
                              </span>
                              <strong className="text-sm font-semibold text-foreground">
                                {st.santriNama}
                              </strong>
                              <Badge variant="outline" className="text-[10px] py-0">
                                {st.jilidNama || "-"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">
                                Subtotal Siswa:
                              </span>
                              <span className="text-xs font-bold text-primary font-mono">
                                {formatRupiah(st.subtotal)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0 shrink-0"
                              onClick={() => handleRemoveStudent(st.santriId)}
                              title="Hapus santri dari invoice"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={15} />
                            </Button>
                          </div>
                        </div>

                        {/* Pilihan Bulan Tagihan */}
                        <div>
                          <Label className="text-[11px] text-muted-foreground mb-1.5 block">
                            Pilih Bulan yang Ditagihkan ({st.months.length} Bulan Terpilih):
                          </Label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {monthOptions.map((m) => {
                              const isApplicable = santriObj
                                ? isMonthApplicable(santriObj, m.value)
                                : true;
                              const isAlreadyPaid = isPaid(st.santriId, m.value);
                              const isSelected = st.months.includes(m.value);

                              if (!isApplicable) {
                                return (
                                  <div
                                    key={m.value}
                                    className="rounded border border-dashed p-1.5 text-center text-[10px] text-muted-foreground/40 bg-muted/10 cursor-not-allowed"
                                    title="Sebelum tanggal masuk siswa"
                                  >
                                    {m.label.split(" ")[0]}
                                    <span className="block text-[8px] text-muted-foreground/30">N/A</span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  key={m.value}
                                  onClick={() => handleToggleMonth(st.santriId, m.value)}
                                  className={`rounded border p-1.5 text-center text-[10px] font-medium transition-colors cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground shadow-2xs font-bold"
                                      : isAlreadyPaid
                                        ? "border-success-border bg-success-subtle text-success hover:bg-success/20"
                                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                                  }`}
                                  title={
                                    isSelected
                                      ? "Terpilih dalam tagihan"
                                      : isAlreadyPaid
                                        ? "Sudah lunas di sistem (klik jika ingin tetap dimasukkan)"
                                        : "Belum lunas (klik untuk memasukkan)"
                                  }
                                >
                                  <span>{m.label.split(" ")[0]}</span>
                                  <span className="block text-[8px] opacity-80">
                                    {isSelected ? "Tagih" : isAlreadyPaid ? "Lunas" : "Belum"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Input Tarif per Siswa */}
                        <div className="flex items-center gap-3 pt-1">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Tarif SPP Bulanan:
                          </Label>
                          <div className="flex items-center gap-1.5 w-40">
                            <span className="text-xs text-muted-foreground font-mono">Rp</span>
                            <Input
                              type="number"
                              min={0}
                              step={5000}
                              value={st.monthlyFee}
                              onChange={(e) =>
                                handleFeeChange(st.santriId, Number(e.target.value) || 0)
                              }
                              className="h-7 text-xs font-mono"
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            × {st.months.length} bulan ={" "}
                            <strong className="text-foreground">{formatRupiah(st.subtotal)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {selectedStudents.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground bg-background">
                      Belum ada siswa yang dipilih. Silakan pilih siswa dari dropdown di atas untuk memulai.
                    </div>
                  )}
                </div>
              </div>

              {/* Bagian 4: Diskon / Potongan / Biaya Tambahan */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    4. Penyesuaian / Diskon Saudara
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    (Gunakan tanda minus <code>-</code> untuk potongan)
                  </span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs">
                  <Input
                    placeholder="Keterangan (contoh: Diskon Saudara, Infaq Buku)"
                    value={adjLabel}
                    onChange={(e) => setAdjLabel(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <div className="flex items-center gap-1 w-44">
                    <span className="text-xs text-muted-foreground font-mono">Rp</span>
                    <Input
                      type="number"
                      placeholder="-20000 atau 15000"
                      value={adjAmount}
                      onChange={(e) =>
                        setAdjAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={handleAddAdjustment}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-1" />
                    Tambah
                  </Button>
                </div>

                {adjustments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {adjustments.map((adj) => (
                      <div
                        key={adj.id}
                        className="flex items-center justify-between rounded border bg-background px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{adj.label}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              adj.amount < 0 ? "text-emerald-600" : "text-foreground"
                            }`}
                          >
                            {adj.amount < 0 ? "-" : "+"} {formatRupiah(Math.abs(adj.amount))}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdjustment(adj.id)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bagian 5: Rekening Transfer & Catatan */}
              <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  5. Instruksi Transfer & Catatan Pembayaran
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <Label className="text-xs">Bank / E-Wallet</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="BSI / BCA / GoPay"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nomor Rekening</Label>
                    <Input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="123456789"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Atas Nama Rekening</Label>
                    <Input
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="LPQ Tarbiyatul Ummah"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Catatan Tambahan untuk Orang Tua</Label>
                    <Textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Mohon sertakan nama santri pada berita transfer..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Ringkasan Total Tagihan */}
              <div className="rounded-xl border bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Tagihan SPP:</p>
                  <p className="text-xs text-foreground font-mono">
                    Subtotal SPP: {formatRupiah(totalSpp)}
                    {totalAdjustments !== 0 && (
                      <span className="text-muted-foreground ml-2">
                        (Penyesuaian: {totalAdjustments < 0 ? "-" : "+"}
                        {formatRupiah(Math.abs(totalAdjustments))})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                    TOTAL HARUS DIBAYAR:
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-primary font-mono">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="border-t bg-background p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Download PDF */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isPdfLoading || selectedStudents.length === 0}
              className="gap-1.5 flex-1 sm:flex-none text-xs"
            >
              <HugeiconsIcon icon={Download05Icon} size={15} />
              {isPdfLoading ? "Membuat PDF..." : "Unduh PDF"}
            </Button>

            {/* Download Gambar PNG */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isImageLoading || selectedStudents.length === 0}
              className="gap-1.5 flex-1 sm:flex-none text-xs"
              title="Unduh invoice sebagai gambar (PNG) siap share"
            >
              <FileImage size={15} />
              {isImageLoading ? "Membuat..." : "Gambar (PNG)"}
            </Button>

            {/* Salin Pesan WA */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWhatsApp}
              disabled={selectedStudents.length === 0}
              className="gap-1.5 flex-1 sm:flex-none text-xs"
            >
              <HugeiconsIcon
                icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                size={15}
                className={copied ? "text-success" : ""}
              />
              {copied ? "Tersalin!" : "Salin Pesan WA"}
            </Button>

            {/* Print */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:inline-flex text-xs"
              title="Cetak langsung"
            >
              <HugeiconsIcon icon={PrinterIcon} size={15} />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>

            {/* Simpan Tagihan (Belum Bayar) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSave("unpaid")}
              disabled={isSubmitting || selectedStudents.length === 0}
              className="text-xs"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>

            {/* Simpan & Tandai Lunas Langsung (Trigger SPP Sync) */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleSave("paid")}
              disabled={isSubmitting || selectedStudents.length === 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
              {isSubmitting ? "Memproses..." : "Tandai Lunas & Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceGeneratorDialog;
