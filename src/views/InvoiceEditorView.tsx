import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toast } from "@/components/master/Toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download05Icon,
  Copy01Icon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  PrinterIcon,
  ArrowLeft02Icon,
  Invoice01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { FileImage, Sparkles, Building2, User, HelpCircle } from "lucide-react";
import type {
  InvoiceAdjustment,
  InvoiceData,
  InvoiceStatus,
  InvoiceStudentItem,
  Santri,
  SantriType,
  SppInvoiceRecord,
  SppPayment,
} from "@/types";
import type { AcademicMonthOption } from "@/utils/academicPeriod";
import { organizationConfig, useTerms } from "@/config/organization";
import {
  getGuru,
  getJilid,
  getSantri,
  getSantriTypes,
} from "@/services/masterService";
import {
  getAcademicYears,
  getDefaultAcademicYearStart,
} from "@/services/academicYearService";
import {
  getSppPaymentsByAcademicYear,
  getSppPaymentId,
} from "@/services/financeService";
import {
  getInvoiceById,
  saveInvoice,
  updateInvoiceStatus,
} from "@/services/invoiceService";
import { AddStudentInvoiceDialog } from "@/components/finance/AddStudentInvoiceDialog";
import { EditStudentMonthsDialog } from "@/components/finance/EditStudentMonthsDialog";
import { generateInvoicePdf } from "@/services/invoicePdfService";
import { exportInvoiceAsImage } from "@/services/invoiceImageService";
import {
  formatMonthLabel,
  formatRupiah,
  formatShortDate,
  generateInvoiceNumber,
  generateInvoiceWhatsAppMessage,
} from "@/utils/invoiceUtils";
import {
  getAcademicMonthOptions,
  getCurrentAcademicYearStart,
} from "@/utils/academicPeriod";

export const InvoiceEditorView: React.FC = () => {
  const { id: routeInvoiceId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedSantriId = searchParams.get("santriId");
  const navigate = useNavigate();
  const terms = useTerms();

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Master Data
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [santriTypes, setSantriTypes] = useState<SantriType[]>([]);
  const [jilidMap, setJilidMap] = useState<Map<string, string>>(new Map());
  const [paymentList, setPaymentList] = useState<SppPayment[]>([]);
  const [academicYearStart, setAcademicYearStart] = useState<number>(
    getCurrentAcademicYearStart(),
  );

  // Invoice State (Modeled like invoice-generator.com)
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>("unpaid");
  const [existingRecord, setExistingRecord] = useState<SppInvoiceRecord | null>(
    null,
  );

  // Header State
  const [headerTitle, setHeaderTitle] = useState(
    organizationConfig.invoiceTitle || `INVOICE TAGIHAN ${terms.paymentLabel}`,
  );
  const [orgName, setOrgName] = useState(organizationConfig.name);
  const [orgAddress, setOrgAddress] = useState(organizationConfig.address || "");
  const [orgPhone, setOrgPhone] = useState(organizationConfig.phone || "");
  const [showLogo, setShowLogo] = useState(true);

  // Meta Information (Default empty dates as requested)
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [issuedDate, setIssuedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recipientName, setRecipientName] = useState("");

  // Line items (Students & Months)
  const [selectedStudents, setSelectedStudents] = useState<InvoiceStudentItem[]>(
    [],
  );

  // Student Dialogs State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<InvoiceStudentItem | null>(
    null,
  );

  // Adjustments (Discounts / Extra Fees)
  const [adjustments, setAdjustments] = useState<InvoiceAdjustment[]>([]);
  const [showAddAdjustment, setShowAddAdjustment] = useState(false);
  const [newAdjName, setNewAdjName] = useState("");
  const [newAdjAmount, setNewAdjAmount] = useState<number | "">("");

  // Payment Transfer Details (Prefilled with Primary Account from Settings)
  const primaryAccount =
    (organizationConfig.paymentAccounts || []).find((a) => a.isDefault) ||
    (organizationConfig.paymentAccounts || [])[0];

  const [bankName, setBankName] = useState(
    primaryAccount?.bankName || organizationConfig.bankName || "",
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    primaryAccount?.accountNumber ||
      organizationConfig.bankAccountNumber ||
      "",
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    primaryAccount?.accountHolder ||
      organizationConfig.bankAccountHolder ||
      "",
  );
  const [notes, setNotes] = useState(
    organizationConfig.paymentInstructions || "",
  );

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    [],
  );

  const monthOptions = useMemo(
    () => getAcademicMonthOptions(academicYearStart),
    [academicYearStart],
  );

  const paymentByKey = useMemo(() => {
    return paymentList.reduce(
      (acc, p) => {
        acc[`${p.santriId}_${p.month}`] = p;
        return acc;
      },
      {} as Record<string, SppPayment>,
    );
  }, [paymentList]);

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

  const isPaid = useCallback(
    (santriId: string, month: string) => {
      return paymentByKey[`${santriId}_${month}`]?.isPaid === true;
    },
    [paymentByKey],
  );

  // Helper untuk menentukan bulan masuk santri
  const isMonthApplicable = useCallback((santri: Santri, monthValue: string) => {
    const entryMonth = santri.tanggalMasuk
      ? santri.tanggalMasuk.slice(0, 7)
      : santri.createdAt
        ? new Date(santri.createdAt).toISOString().slice(0, 7)
        : "1970-01";
    if (monthValue < entryMonth) return false;
    if (santri.tanggalKeluar) {
      const exitMonth = santri.tanggalKeluar.slice(0, 7);
      if (monthValue > exitMonth) return false;
    }
    return true;
  }, []);

  const createStudentItem = useCallback(
    (santri: Santri): InvoiceStudentItem => {
      const defaultFee = Number(organizationConfig.defaultMonthlyFee) || 50000;
      const unpaidMonths = monthOptions
        .filter(
          (m) =>
            isMonthApplicable(santri, m.value) && !isPaid(santri.id, m.value),
        )
        .map((m) => m.value);

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

  // Initial Data Fetching
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [santriRes, jilidRes, guruRes, academicYearRes, tipeRes] =
          await Promise.all([
            getSantri(),
            getJilid(),
            getGuru(),
            getAcademicYears().catch(() => []),
            getSantriTypes().catch(() => []),
          ]);

        if (!mounted) return;

        setSantriList(santriRes);
        setSantriTypes(tipeRes);
        setJilidMap(new Map(jilidRes.map((j) => [j.id, j.nama])));

        const defaultYear = getDefaultAcademicYearStart(academicYearRes);
        setAcademicYearStart(defaultYear);

        const payments = await getSppPaymentsByAcademicYear(defaultYear);
        if (mounted) setPaymentList(payments);

        // Jika rute edit: /keuangan/invoice/:id
        if (routeInvoiceId && routeInvoiceId !== "buat") {
          setIsEditMode(true);
          const record = await getInvoiceById(routeInvoiceId);
          if (!mounted) return;
          if (record) {
            setExistingRecord(record);
            setInvoiceId(record.id);
            setInvoiceNumber(record.invoiceNumber);
            setIssuedDate(record.issuedDate);
            setDueDate(record.dueDate || "");
            setRecipientName(record.recipientName || "");
            setInvoiceStatus(record.status);

            const d = record.data;
            if (d) {
              setHeaderTitle(d.header?.title || "INVOICE TAGIHAN SPP");
              setOrgName(d.header?.organizationName || organizationConfig.name);
              setOrgAddress(d.header?.address || organizationConfig.address || "");
              setOrgPhone(d.header?.phone || organizationConfig.phone || "");
              setShowLogo(d.header?.showLogo !== false);
              setSelectedStudents(d.students || []);
              setAdjustments(d.adjustments || []);
              setBankName(d.bankName || "");
              setBankAccountNumber(d.bankAccountNumber || "");
              setBankAccountHolder(d.bankAccountHolder || "");
              setNotes(d.notes || "");
            }
          } else {
            triggerToast("Invoice tidak ditemukan.", "error");
          }
        } else {
          // Mode Buat Baru
          setIsEditMode(false);
          const newId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          setInvoiceId(newId);

          // Cek apakah ada query param ?santriId=...
          if (preselectedSantriId) {
            const preSantri = santriRes.find((s) => s.id === preselectedSantriId);
            if (preSantri) {
              const defaultFee =
                Number(organizationConfig.defaultMonthlyFee) || 50000;
              const unpaidMonths = getAcademicMonthOptions(defaultYear)
                .filter((m) => {
                  const entryMonth = preSantri.tanggalMasuk
                    ? preSantri.tanggalMasuk.slice(0, 7)
                    : "1970-01";
                  if (m.value < entryMonth) return false;
                  return !payments.some(
                    (p) =>
                      p.santriId === preSantri.id &&
                      p.month === m.value &&
                      p.isPaid,
                  );
                })
                .map((m) => m.value);

              setSelectedStudents([
                {
                  santriId: preSantri.id,
                  santriNama: preSantri.nama,
                  jilidNama:
                    jilidRes.find((j) => j.id === preSantri.jilidId)?.nama || "-",
                  months:
                    unpaidMonths.length > 0
                      ? unpaidMonths
                      : [getAcademicMonthOptions(defaultYear)[0].value],
                  monthlyFee: defaultFee,
                  subtotal: (unpaidMonths.length || 1) * defaultFee,
                },
              ]);
            }
          }
        }
      } catch (error) {
        if (mounted) {
          triggerToast("Gagal memuat data keuangan.", "error");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [routeInvoiceId, preselectedSantriId, triggerToast]);

  // Handle Menambah Santri dari Dialog 2-Step
  const handleAddStudentFromDialog = (item: InvoiceStudentItem) => {
    setSelectedStudents((prev) => [...prev, item]);
    triggerToast(`Santri ${item.santriNama} berhasil ditambahkan ke invoice.`);
  };

  // Handle Simpan Perubahan Bulan / Tarif Santri dari Modal
  const handleSaveStudentMonths = (updatedItem: InvoiceStudentItem) => {
    setSelectedStudents((prev) =>
      prev.map((s) => (s.santriId === updatedItem.santriId ? updatedItem : s)),
    );
    triggerToast(`Bulan tagihan untuk ${updatedItem.santriNama} diperbarui.`);
  };

  // Handle Pilih Rekening Tersimpan
  const handleSelectSavedAccount = (accountId: string) => {
    const acc = (organizationConfig.paymentAccounts || []).find(
      (a) => a.id === accountId,
    );
    if (acc) {
      setBankName(acc.bankName);
      setBankAccountNumber(acc.accountNumber);
      setBankAccountHolder(acc.accountHolder);
      triggerToast(`Rekening ${acc.bankName} (${acc.accountNumber}) dipilih.`);
    }
  };

  // Handle Hapus Santri
  const handleRemoveStudent = (santriId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.santriId !== santriId));
  };

  // Handle Toggle Bulan
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
    if (!newAdjName.trim() || newAdjAmount === "" || newAdjAmount === 0) return;
    const newAdj: InvoiceAdjustment = {
      id: `adj_${Date.now()}`,
      label: newAdjName.trim(),
      amount: Number(newAdjAmount),
    };
    setAdjustments((prev) => [...prev, newAdj]);
    setNewAdjName("");
    setNewAdjAmount("");
    setShowAddAdjustment(false);
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

  // Current Invoice Data Object
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
  const handleSave = async (statusToSave?: InvoiceStatus) => {
    if (selectedStudents.length === 0) {
      triggerToast("Pilih minimal 1 siswa untuk membuat invoice.", "error");
      return;
    }

    const finalStatus = statusToSave ?? invoiceStatus;
    setIsSubmitting(true);

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
        createdAt: existingRecord?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await saveInvoice(recordToSave);
      setInvoiceStatus(finalStatus);
      setExistingRecord(recordToSave);
      setIsEditMode(true);

      triggerToast(
        finalStatus === "paid"
          ? `Invoice ${recordToSave.invoiceNumber} berhasil disimpan & SPP siswa otomatis ditandai LUNAS!`
          : `Invoice ${recordToSave.invoiceNumber} berhasil disimpan ke database.`,
        "success",
      );
    } catch (err: any) {
      triggerToast(err?.message || "Gagal menyimpan invoice.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Lunas / Belum Lunas
  const handleToggleStatus = async (nextStatus: InvoiceStatus) => {
    if (!existingRecord) {
      await handleSave(nextStatus);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateInvoiceStatus(invoiceId, nextStatus, existingRecord);
      setInvoiceStatus(nextStatus);
      setExistingRecord(updated);
      triggerToast(
        nextStatus === "paid"
          ? "Status invoice diubah menjadi LUNAS & pembayaran SPP siswa berhasil diperbarui!"
          : "Status invoice berhasil diperbarui.",
        "success",
      );
    } catch (err: any) {
      triggerToast(err?.message || "Gagal mengubah status invoice.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unduh PDF
  const handleDownloadPdf = async () => {
    if (selectedStudents.length === 0) {
      triggerToast("Pilih minimal 1 siswa terlebih dahulu.", "error");
      return;
    }

    setIsPdfLoading(true);
    try {
      await generateInvoicePdf(currentInvoiceData);
    } catch {
      triggerToast("Gagal membuat file PDF invoice.", "error");
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Unduh Gambar PNG
  const handleDownloadImage = async () => {
    if (selectedStudents.length === 0) {
      triggerToast("Pilih minimal 1 siswa terlebih dahulu.", "error");
      return;
    }

    setIsImageLoading(true);
    try {
      await exportInvoiceAsImage(currentInvoiceData, invoiceStatus);
    } catch {
      triggerToast("Gagal membuat gambar invoice.", "error");
    } finally {
      setIsImageLoading(false);
    }
  };

  // Salin Pesan WA
  const handleCopyWhatsApp = async () => {
    if (selectedStudents.length === 0) {
      triggerToast("Pilih minimal 1 siswa terlebih dahulu.", "error");
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
      triggerToast("Teks tagihan WhatsApp berhasil disalin!", "success");
    } catch {
      triggerToast("Gagal menyalin teks ke clipboard.", "error");
    }
  };

  // Cetak Dokumen
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-page min-h-screen bg-slate-100/70 py-6 sm:py-8">
      {toastMessage && (
        <Toast
          show={!!toastMessage}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="app-container-wide">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="w-fit px-2 -ml-2 text-slate-600 hover:text-slate-900">
            <Link to="/keuangan" className="flex items-center gap-1.5 font-medium">
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={2} />
              Kembali ke Keuangan {terms.paymentLabel}
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Badge
              variant={invoiceStatus === "paid" ? "success" : invoiceStatus === "cancelled" ? "danger" : "neutral"}
              className="px-3 py-1 text-xs uppercase font-bold tracking-wider"
            >
              Status: {invoiceStatus === "paid" ? "Lunas" : invoiceStatus === "cancelled" ? "Dibatalkan" : "Belum Bayar"}
            </Badge>
            {isEditMode && (
              <span className="text-xs text-muted-foreground font-mono">
                ID: {invoiceId}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <LoadingState size="lg" text="Memuat Data Invoice" />
          </div>
        ) : (
          /* Two-Column Grid: Document Paper Sheet (Left) + Action Sidebar (Right) */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-8 items-start">
            {/* ============================================================ */}
            {/* THE INVOICE DOCUMENT PAPER SHEET (Modeled like invoice-generator.com) */}
            {/* ============================================================ */}
            <div
              id="invoice-printable-area"
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 md:p-12 space-y-8 text-slate-800 transition-all"
            >
              {/* Header Section: Logo & Sender (Left) vs Invoice Title & Meta (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-b border-slate-100 pb-8">
                {/* Left: Logo, Lembaga Details & Bill To */}
                <div className="space-y-4">
                  {/* Logo Box (Modeled like + Add Your Logo in invoice-generator.com) */}
                  <div>
                    {showLogo && organizationConfig.faviconUrl ? (
                      <div className="relative inline-block group">
                        <img
                          src={organizationConfig.faviconUrl}
                          alt="Logo"
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-slate-200 object-contain p-2 bg-slate-50 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLogo(false)}
                          className="absolute -top-2 -right-2 bg-slate-800 text-white hover:bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs text-[10px]"
                          title="Sembunyikan Logo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowLogo(true)}
                        className="h-16 w-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/60 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-all cursor-pointer font-medium"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} />
                        Tampilkan Logo
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Diterbitkan Oleh (Lembaga):
                    </Label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Nama Lembaga"
                      className="font-bold text-base text-slate-900 border-transparent hover:border-slate-300 focus:border-primary px-2 -ml-2 h-9 bg-transparent"
                    />
                    <Input
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Alamat Lembaga (contoh: Jl. Melati No. 15)"
                      className="text-xs text-slate-600 border-transparent hover:border-slate-300 focus:border-primary px-2 -ml-2 h-7 bg-transparent"
                    />
                    <Input
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="Kontak / WhatsApp (contoh: 0812-3456-7890)"
                      className="text-xs text-slate-600 border-transparent hover:border-slate-300 focus:border-primary px-2 -ml-2 h-7 bg-transparent"
                    />
                  </div>

                  {/* Bill To Section: Orang Tua / Wali */}
                  <div className="pt-2 space-y-1.5 max-w-sm">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Ditujukan Kepada (Wali Santri):
                    </Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nama Wali / Orang Tua Santri (contoh: Bpk. Ahmad Fauzy)"
                      className="font-semibold text-sm text-slate-900 border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Right: Big INVOICE Title, Meta & Balance Due Bar */}
                <div className="flex flex-col md:items-end space-y-4 text-right">
                  <Input
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    placeholder="INVOICE"
                    className="font-black text-2xl sm:text-3xl text-primary md:text-right uppercase tracking-tight border-transparent hover:border-slate-300 focus:border-primary px-2 h-11 bg-transparent max-w-full"
                  />

                  {/* Metadata Grid */}
                  <div className="space-y-2 w-full max-w-xs self-end">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 font-medium">No. Invoice</span>
                      <Input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="h-7 text-xs font-mono font-semibold text-right w-36 border-slate-200"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 font-medium">Tanggal Terbit</span>
                      <Input
                        type="date"
                        value={issuedDate}
                        onChange={(e) => setIssuedDate(e.target.value)}
                        className="h-7 text-xs text-right w-36 border-slate-200"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 font-medium">Jatuh Tempo</span>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="h-7 text-xs text-right w-36 border-slate-200"
                      />
                    </div>

                    {/* Balance Due Highlight Bar (Exact match to Reference 1 & 2) */}
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-100/90 border border-slate-200/80 px-3.5 py-2 text-xs">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                        Total Tagihan:
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table (Tabel Rincian Santri & Bulan) */}
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-semibold">
                      <tr>
                        <th className="py-3 px-4 w-10 text-center">No</th>
                        <th className="py-3 px-4">Nama Siswa / Santri</th>
                        <th className="py-3 px-4">Bulan yang Ditagihkan</th>
                        <th className="py-3 px-4 text-right w-32">Tarif/Bulan</th>
                        <th className="py-3 px-4 text-right w-36">Subtotal</th>
                        <th className="py-3 px-3 w-10 text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedStudents.map((st, idx) => {
                        const santriObj = santriMap.get(st.santriId);

                        return (
                          <tr key={st.santriId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Nama Siswa & Kelas */}
                            <td className="py-3 px-4 align-top">
                              <span className="font-bold text-sm text-slate-900 block">
                                {st.santriNama}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Kelas: {st.jilidNama || "-"}
                              </span>
                            </td>

                            {/* Pilihan Bulan Tagihan: Compact with Dialog Trigger */}
                            <td className="py-3 px-4 align-top space-y-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingStudent(st)}
                                  className="h-7 text-xs font-semibold gap-1.5 border-slate-300 hover:border-primary hover:text-primary transition-colors bg-white shadow-2xs"
                                  title="Klik untuk memilih atau mengubah bulan tagihan"
                                >
                                  <span>{st.months.length} Bulan</span>
                                  <span className="text-[10px] text-muted-foreground">▾</span>
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(st)}
                                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                                >
                                  Atur Bulan
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-tight">
                                {st.months.length > 0
                                  ? st.months.map(formatMonthLabel).join(", ")
                                  : "Belum ada bulan dipilih"}
                              </p>
                            </td>

                            {/* Input Tarif Bulanan */}
                            <td className="py-3 px-4 text-right align-top">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400 text-xs">Rp</span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={5000}
                                  value={st.monthlyFee}
                                  onChange={(e) =>
                                    handleFeeChange(st.santriId, Number(e.target.value) || 0)
                                  }
                                  className="h-8 text-xs font-mono text-right w-24 border-slate-200"
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-1">/bulan</span>
                            </td>

                            {/* Subtotal Siswa */}
                            <td className="py-3 px-4 text-right align-top font-bold text-sm text-slate-900 font-mono">
                              {formatRupiah(st.subtotal)}
                            </td>

                            {/* Hapus Baris */}
                            <td className="py-3 px-3 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(st.santriId)}
                                className="text-slate-400 hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                                title="Hapus siswa dari invoice"
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {selectedStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                            Belum ada baris siswa yang ditambahkan. Klik tombol di bawah untuk menambahkan siswa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Full-Width + Line Item Strip (Exact invoice-generator.com style) */}
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={15} />
                  + Tambah Santri / Baris Tagihan
                </button>
              </div>

              {/* Bottom Section: Notes (Left) vs Summary Totals + Bank (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t border-slate-100 pt-6">
                {/* Left: Catatan */}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Catatan Pembayaran:
                  </Label>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mohon sertakan nama santri pada berita transfer dan konfirmasi bukti transfer via WhatsApp..."
                    className="text-xs bg-white border-slate-200"
                  />
                </div>

                {/* Right: Subtotal, Adjustments, Grand Total & Rekening */}
                <div className="space-y-3 md:pl-6 text-right">
                  <div className="flex items-center justify-between py-1.5 text-xs text-slate-600 border-b border-slate-100">
                    <span className="font-medium">Subtotal SPP:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(totalSpp)}
                    </span>
                  </div>

                  {/* Adjustments Rows */}
                  {adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex items-center justify-between py-1 text-xs text-amber-800 bg-amber-50/50 px-2 rounded-md"
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveAdjustment(adj.id)}
                          className="text-amber-500 hover:text-destructive cursor-pointer"
                        >
                          ✕
                        </button>
                        <span>{adj.label}:</span>
                      </div>
                      <span className="font-mono font-bold">
                        {adj.amount < 0 ? "-" : "+"} {formatRupiah(Math.abs(adj.amount))}
                      </span>
                    </div>
                  ))}

                  {/* Button Add Adjustment */}
                  {!showAddAdjustment ? (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowAddAdjustment(true)}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={13} />
                        Tambah Diskon / Potongan
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-left space-y-2">
                      <p className="text-[11px] font-bold text-primary">Tambah Penyesuaian:</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          placeholder="Nama (contoh: Diskon Saudara)"
                          value={newAdjName}
                          onChange={(e) => setNewAdjName(e.target.value)}
                          className="h-7 text-xs bg-white"
                        />
                        <Input
                          type="number"
                          placeholder="Nominal (-20000)"
                          value={newAdjAmount}
                          onChange={(e) =>
                            setNewAdjAmount(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="h-7 text-xs font-mono bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => setShowAddAdjustment(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={handleAddAdjustment}
                        >
                          Terapkan
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="pt-3 border-t-2 border-slate-900 flex items-baseline justify-between text-slate-900">
                    <span className="text-sm font-black uppercase tracking-wider">
                      TOTAL HARUS DIBAYAR:
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>

                  {/* Rekening Pembayaran */}
                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-left">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Rekening Pembayaran:
                      </Label>
                      {organizationConfig.paymentAccounts &&
                        organizationConfig.paymentAccounts.length > 0 && (
                          <div className="w-48">
                            <Select onValueChange={handleSelectSavedAccount}>
                              <SelectTrigger className="h-7 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Pilih Rekening..." />
                              </SelectTrigger>
                              <SelectContent>
                                {organizationConfig.paymentAccounts.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.bankName} - {acc.accountNumber}{" "}
                                    {acc.accountHolder ? `(${acc.accountHolder})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">Bank / E-Wallet</span>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="BSI / BCA / GoPay"
                          className="h-7 text-xs text-right w-48 border-slate-200 bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">No. Rekening</span>
                        <Input
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="1234567890"
                          className="h-7 text-xs font-mono font-semibold text-right w-48 border-slate-200 bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">Atas Nama</span>
                        <Input
                          value={bankAccountHolder}
                          onChange={(e) => setBankAccountHolder(e.target.value)}
                          placeholder="LPQ Tarbiyatul Ummah"
                          className="h-7 text-xs text-right w-48 border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* STICKY ACTION SIDEBAR (Right Column like invoice-generator.com) */}
            {/* ============================================================ */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Primary Action Card */}
              <Card className="p-5 space-y-3 bg-white shadow-sm border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Aksi Tagihan
                </p>

                {/* Simpan Tagihan (Belum Bayar) */}
                <Button
                  type="button"
                  variant="default"
                  onClick={() => handleSave("unpaid")}
                  disabled={isSubmitting || selectedStudents.length === 0}
                  className="w-full text-xs font-bold h-10 shadow-xs"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mr-1.5" />
                  {isSubmitting ? "Menyimpan..." : isEditMode ? "Perbarui Tagihan" : "Simpan Tagihan"}
                </Button>

                {/* Tandai Lunas (Trigger SPP Auto-Sync) */}
                {invoiceStatus !== "paid" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleToggleStatus("paid")}
                    disabled={isSubmitting || selectedStudents.length === 0}
                    className="w-full text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent gap-1.5"
                    title="Tandai lunas dan otomatis memperbarui status SPP siswa"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                    Tandai Sudah Dibayar (Lunas)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleToggleStatus("unpaid")}
                    disabled={isSubmitting}
                    className="w-full text-xs text-muted-foreground hover:text-destructive h-9 gap-1.5"
                    title="Batalkan status lunas"
                  >
                    <HugeiconsIcon icon={CancelCircleIcon} size={15} />
                    Batalkan Status Lunas
                  </Button>
                )}
              </Card>

              {/* Export & Sharing Card */}
              <Card className="p-5 space-y-3 bg-white shadow-sm border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Ekspor & Bagikan
                </p>

                {/* Unduh PDF */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isPdfLoading || selectedStudents.length === 0}
                  className="w-full justify-start text-xs h-9 gap-2"
                >
                  <HugeiconsIcon icon={Download05Icon} size={15} className="text-slate-600" />
                  {isPdfLoading ? "Membuat PDF..." : "Unduh Dokumen PDF (.pdf)"}
                </Button>

                {/* Unduh Gambar PNG */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  disabled={isImageLoading || selectedStudents.length === 0}
                  className="w-full justify-start text-xs h-9 gap-2"
                >
                  <FileImage size={15} className="text-slate-600" />
                  {isImageLoading ? "Membuat Gambar..." : "Unduh Gambar (.png)"}
                </Button>

                {/* Salin Pesan WA */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWhatsApp}
                  disabled={selectedStudents.length === 0}
                  className="w-full justify-start text-xs h-9 gap-2"
                >
                  <HugeiconsIcon
                    icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                    size={15}
                    className={copied ? "text-success" : "text-slate-600"}
                  />
                  {copied ? "Teks Tersalin!" : "Salin Pesan WhatsApp"}
                </Button>

                {/* Cetak Langsung */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  className="w-full justify-start text-xs h-9 gap-2 text-slate-600"
                >
                  <HugeiconsIcon icon={PrinterIcon} size={15} />
                  Cetak Dokumen (Print)
                </Button>
              </Card>

              {/* Information Help Card */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-[11px] text-slate-500 space-y-1.5 bg-slate-50/50">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <HelpCircle size={13} />
                  Tips Penggunaan:
                </p>
                <p>
                  • Format dokumen di kiri adalah tampilan persis seperti apa yang akan dicetak dan diunduh.
                </p>
                <p>
                  • Mengubah status menjadi <strong>Lunas</strong> akan secara otomatis mencentang lunas bulan-bulan siswa tersebut di sistem Keuangan SPP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2-Step Modal for Adding Student to Invoice */}
        <AddStudentInvoiceDialog
          open={isAddStudentOpen}
          onOpenChange={setIsAddStudentOpen}
          santriList={santriList}
          jilidMap={jilidMap}
          academicMonths={monthOptions}
          defaultMonthlyFee={Number(organizationConfig.defaultMonthlyFee) || 50000}
          feeCategories={organizationConfig.feeCategories || []}
          santriTypes={santriTypes}
          existingStudentIds={selectedStudents.map((s) => s.santriId)}
          isMonthApplicable={isMonthApplicable}
          isMonthPaid={isPaid}
          onAddStudent={handleAddStudentFromDialog}
        />

        {/* Modal for Editing Student Months and Fee */}
        <EditStudentMonthsDialog
          open={Boolean(editingStudent)}
          onOpenChange={(open) => {
            if (!open) setEditingStudent(null);
          }}
          studentItem={editingStudent}
          academicMonths={monthOptions}
          feeCategories={organizationConfig.feeCategories || []}
          isMonthPaid={isPaid}
          onSave={handleSaveStudentMonths}
          onRemove={handleRemoveStudent}
        />
      </div>
    </div>
  );
};

export default InvoiceEditorView;
