import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import {
  Building2,
  Globe,
  Languages,
  Coins,
  CreditCard,
  ChevronRight,
  RotateCcw,
  UploadCloud,
  Check,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DEFAULT_FAVICON_URL,
  organizationConfig,
  resetOrganizationConfig,
  saveOrganizationConfig,
  terms,
  type FeeCategoryItem,
  type PaymentAccountItem,
} from "../config/organization";
import { getSantriTypes } from "@/services/masterService";
import type { SantriType } from "@/types";
import { formatRupiah } from "@/utils/invoiceUtils";

type SheetSection = "identity" | "terms" | "tariffs" | "bank" | null;

export const OrganizationTermsView: React.FC = () => {
  const [activeSheet, setActiveSheet] = useState<SheetSection>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Master Tipe Santri (untuk opsi penautan tarif)
  const [santriTypes, setSantriTypes] = useState<SantriType[]>([]);

  // Draft Kategori Tarif Baru
  const [newTariffName, setNewTariffName] = useState("");
  const [newTariffAmount, setNewTariffAmount] = useState<number | "">("");
  const [newTariffTipeId, setNewTariffTipeId] = useState("");
  const [newTariffIsDefault, setNewTariffIsDefault] = useState(false);

  // Draft Rekening Baru
  const [newBank, setNewBank] = useState("");
  const [newAccNum, setNewAccNum] = useState("");
  const [newHolder, setNewHolder] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  const [formData, setFormData] = useState({
    name: organizationConfig.name,
    typeLabel: organizationConfig.typeLabel,
    appTitle: organizationConfig.appTitle,
    faviconUrl: organizationConfig.faviconUrl,
    address: organizationConfig.address,
    phone: organizationConfig.phone,
    defaultMonthlyFee: organizationConfig.defaultMonthlyFee,
    feeCategories: organizationConfig.feeCategories || [],
    paymentAccounts: organizationConfig.paymentAccounts || [],
    bankName: organizationConfig.bankName,
    bankAccountNumber: organizationConfig.bankAccountNumber,
    bankAccountHolder: organizationConfig.bankAccountHolder,
    paymentInstructions: organizationConfig.paymentInstructions,
    invoiceTitle: organizationConfig.invoiceTitle,
    studentSingularTitle: terms.studentSingularTitle,
    mentorSingularTitle: terms.mentorSingularTitle,
    levelSingularTitle: terms.levelSingularTitle,
    paymentLabel: terms.paymentLabel,
  });

  useEffect(() => {
    void getSantriTypes()
      .then((res) => setSantriTypes(res))
      .catch(() => setSantriTypes([]));
  }, []);

  const normalizeLower = (value: string) => value.trim().toLowerCase();
  const normalizeTitle = (value: string) => value.trim();

  const syncEditableConfig = () => {
    setFormData({
      name: organizationConfig.name,
      typeLabel: organizationConfig.typeLabel,
      appTitle: organizationConfig.appTitle,
      faviconUrl: organizationConfig.faviconUrl,
      address: organizationConfig.address,
      phone: organizationConfig.phone,
      defaultMonthlyFee: organizationConfig.defaultMonthlyFee,
      feeCategories: organizationConfig.feeCategories || [],
      paymentAccounts: organizationConfig.paymentAccounts || [],
      bankName: organizationConfig.bankName,
      bankAccountNumber: organizationConfig.bankAccountNumber,
      bankAccountHolder: organizationConfig.bankAccountHolder,
      paymentInstructions: organizationConfig.paymentInstructions,
      invoiceTitle: organizationConfig.invoiceTitle,
      studentSingularTitle: terms.studentSingularTitle,
      mentorSingularTitle: terms.mentorSingularTitle,
      levelSingularTitle: terms.levelSingularTitle,
      paymentLabel: terms.paymentLabel,
    });
  };

  const showSavedState = () => {
    setShowSavedMessage(true);
    window.setTimeout(() => {
      setShowSavedMessage(false);
    }, 2500);
  };

  const getSettingsSaveError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Error tidak diketahui.";
    return `Pengaturan gagal disimpan. Detail: ${message}`;
  };

  // Simpan data ke cloud
  const handleSaveCurrentSection = async () => {
    setSaveError("");
    setIsSaving(true);

    try {
      const studentSingularTitle = normalizeTitle(formData.studentSingularTitle);
      const mentorSingularTitle = normalizeTitle(formData.mentorSingularTitle);
      const levelSingularTitle = normalizeTitle(formData.levelSingularTitle);

      const primaryAccount =
        formData.paymentAccounts.find((a) => a.isDefault) ||
        formData.paymentAccounts[0];

      const primaryFee =
        formData.feeCategories.find((f) => f.isDefault) ||
        formData.feeCategories[0];

      const defaultMonthlyFee = primaryFee
        ? primaryFee.amount
        : Number(formData.defaultMonthlyFee) || 50000;

      const orgName = normalizeTitle(formData.name);
      const appTitle = orgName ? `Sistem Absensi ${orgName}` : "Sistem Absensi";

      await saveOrganizationConfig({
        name: orgName,
        typeLabel: normalizeTitle(formData.typeLabel),
        appTitle,
        faviconUrl: formData.faviconUrl || DEFAULT_FAVICON_URL,
        address: formData.address?.trim() ?? "",
        phone: formData.phone?.trim() ?? "",
        defaultMonthlyFee,
        feeCategories: formData.feeCategories,
        paymentAccounts: formData.paymentAccounts,
        bankName: primaryAccount?.bankName || "",
        bankAccountNumber: primaryAccount?.accountNumber || "",
        bankAccountHolder: primaryAccount?.accountHolder || "",
        paymentInstructions: formData.paymentInstructions?.trim() ?? "",
        invoiceTitle: normalizeTitle(formData.invoiceTitle || "INVOICE TAGIHAN SPP"),
        terms: {
          studentSingularTitle,
          studentSingularLower: normalizeLower(studentSingularTitle),
          mentorSingularTitle,
          mentorSingularLower: normalizeLower(mentorSingularTitle),
          levelSingularTitle,
          levelSingularLower: normalizeLower(levelSingularTitle),
          paymentLabel: normalizeTitle(formData.paymentLabel),
        },
      });

      showSavedState();
      setActiveSheet(null);
    } catch (error) {
      setSaveError(getSettingsSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Favicon
  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File favicon harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > 256 * 1024) {
      setUploadError("Ukuran favicon maksimal 256 KB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        faviconUrl: String(reader.result),
      }));
    };
    reader.onerror = () => {
      setUploadError("Favicon gagal dibaca.");
    };
    reader.readAsDataURL(file);
  };

  const resetFavicon = () => {
    setUploadError("");
    setFormData((prev) => ({
      ...prev,
      faviconUrl: DEFAULT_FAVICON_URL,
    }));
  };

  // Multi-Tariff Handlers
  const handleAddTariff = () => {
    if (!newTariffName.trim() || newTariffAmount === "" || Number(newTariffAmount) < 0)
      return;

    const newCategory: FeeCategoryItem = {
      id: `fee_${Date.now()}`,
      name: newTariffName.trim(),
      amount: Number(newTariffAmount),
      santriTypeId: newTariffTipeId || undefined,
      isDefault: newTariffIsDefault || formData.feeCategories.length === 0,
    };

    setFormData((prev) => {
      let updated = [...prev.feeCategories];
      if (newCategory.isDefault) {
        updated = updated.map((c) => ({ ...c, isDefault: false }));
      }
      return {
        ...prev,
        feeCategories: [...updated, newCategory],
      };
    });

    setNewTariffName("");
    setNewTariffAmount("");
    setNewTariffTipeId("");
    setNewTariffIsDefault(false);
  };

  const handleRemoveTariff = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.feeCategories.filter((c) => c.id !== id);
      if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      return {
        ...prev,
        feeCategories: filtered,
      };
    });
  };

  const handleSetDefaultTariff = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      feeCategories: prev.feeCategories.map((c) => ({
        ...c,
        isDefault: c.id === id,
      })),
    }));
  };

  // Payment Accounts Handlers
  const handleAddPaymentAccount = () => {
    if (!newBank.trim() || !newAccNum.trim()) return;
    const newAccount: PaymentAccountItem = {
      id: `acc_${Date.now()}`,
      bankName: newBank.trim(),
      accountNumber: newAccNum.trim(),
      accountHolder: newHolder.trim(),
      isDefault: newIsDefault || formData.paymentAccounts.length === 0,
    };

    setFormData((prev) => {
      let updatedAccounts = [...prev.paymentAccounts];
      if (newAccount.isDefault) {
        updatedAccounts = updatedAccounts.map((a) => ({ ...a, isDefault: false }));
      }
      return {
        ...prev,
        paymentAccounts: [...updatedAccounts, newAccount],
      };
    });

    setNewBank("");
    setNewAccNum("");
    setNewHolder("");
    setNewIsDefault(false);
  };

  const handleRemovePaymentAccount = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.paymentAccounts.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return {
        ...prev,
        paymentAccounts: filtered,
      };
    });
  };

  const handleSetDefaultAccount = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentAccounts: prev.paymentAccounts.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    }));
  };

  const handleResetSettings = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mengembalikan semua pengaturan organisasi ke nilai awal bawaan?",
      )
    )
      return;

    setSaveError("");
    setIsSaving(true);

    try {
      await resetOrganizationConfig();
      syncEditableConfig();
      setUploadError("");
      showSavedState();
    } catch (error) {
      setSaveError(getSettingsSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const primaryAccount =
    formData.paymentAccounts.find((a) => a.isDefault) ||
    formData.paymentAccounts[0];

  const primaryFee =
    formData.feeCategories.find((f) => f.isDefault) ||
    formData.feeCategories[0];

  return (
    <div className="app-page">
      <div className="app-container space-y-6">
        <PageHeader
          title="Pengaturan Organisasi"
          subtitle="Pilih menu di bawah untuk mengedit identitas lembaga, istilah aplikasi, tarif SPP, atau rekening pembayaran."
          backTo="/akun"
        />

        {showSavedMessage && (
          <Alert className="border-success-border bg-success-subtle text-success">
            Pengaturan berhasil disimpan.
          </Alert>
        )}
        {saveError && (
          <Alert variant="destructive" className="block leading-relaxed break-words">
            {saveError}
          </Alert>
        )}

        {/* SETTINGS HUB: GRID OF CATEGORY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Identitas Lembaga & Logo */}
          <Card
            onClick={() => setActiveSheet("identity")}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl bg-card border"
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    Identitas Lembaga & Logo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Logo resmi, nama lembaga, jenis, alamat & kontak kop tagihan
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </CardHeader>
            <CardContent className="text-xs space-y-2 pt-0">
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Logo Lembaga:</span>
                <div className="flex items-center gap-2">
                  <img
                    src={formData.faviconUrl || DEFAULT_FAVICON_URL}
                    alt="Logo Lembaga"
                    className="size-6 object-contain rounded border p-0.5 bg-muted/20"
                  />
                  <span className="text-[11px] text-muted-foreground">Terpasang</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Nama & Jenis:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {formData.name || "-"} ({formData.typeLabel || "Lembaga"})
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Judul Tab Browser:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  Sistem Absensi {formData.name || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Alamat Kop:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {formData.address || "Belum diatur"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Istilah & Bahasa Aplikasi */}
          <Card
            onClick={() => setActiveSheet("terms")}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl bg-card border"
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Languages className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    Istilah & Bahasa Aplikasi
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sebutan fleksibel untuk murid, guru, jilid, dan iuran
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </CardHeader>
            <CardContent className="text-xs space-y-1.5 pt-0">
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Peserta / Pengajar:</span>
                <span className="font-semibold text-foreground">
                  {formData.studentSingularTitle} • {formData.mentorSingularTitle}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Tingkatan / Pembayaran:</span>
                <span className="font-semibold text-foreground">
                  {formData.levelSingularTitle} • {formData.paymentLabel}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kategori & Tarif SPP */}
          <Card
            onClick={() => setActiveSheet("tariffs")}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl bg-card border"
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Coins className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    Kategori & Tarif {formData.paymentLabel || "SPP"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Atur beberapa tarif bulanan (Reguler, Tahfidz, dsb.)
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </CardHeader>
            <CardContent className="text-xs space-y-2 pt-0">
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Tarif Utama:</span>
                <span className="font-bold text-foreground">
                  {primaryFee ? `${primaryFee.name} (${formatRupiah(primaryFee.amount)})` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Total Kategori:</span>
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {formData.feeCategories.length} Kategori Tersedia
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Rekening Pembayaran & Catatan Transfer */}
          <Card
            onClick={() => setActiveSheet("bank")}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl bg-card border"
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    Rekening Pembayaran & Catatan Transfer
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Kelola rekening bank/e-wallet untuk tagihan orang tua
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </CardHeader>
            <CardContent className="text-xs space-y-1.5 pt-0">
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Rekening Utama:</span>
                <span className="font-semibold text-foreground">
                  {primaryAccount
                    ? `${primaryAccount.bankName} - ${primaryAccount.accountNumber} (${primaryAccount.accountHolder || "Utama"})`
                    : "Belum ada rekening"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <span className="text-muted-foreground">Jumlah Rekening:</span>
                <span className="font-medium text-foreground">
                  {formData.paymentAccounts.length} Rekening tersimpan
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tombol Reset Bawaan di Footer Hub */}
        <div className="pt-4 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetSettings}
            disabled={isSaving}
            className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Kembalikan Semua ke Pengaturan Bawaan
          </Button>
        </div>

        {/* ============================================================ */}
        {/* SLIDE-OVER SHEET (SIDEBAR KANAN) HANYA MUNCUL SAAT DIKLIK    */}
        {/* ============================================================ */}
        <Sheet
          open={activeSheet !== null}
          onOpenChange={(open) => {
            if (!open) {
              setActiveSheet(null);
              setUploadError("");
              setSaveError("");
            }
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-lg p-6">
            {/* 1. Sheet: Identitas Lembaga & Logo */}
            {activeSheet === "identity" && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="size-5 text-primary" />
                    Identitas Lembaga & Logo
                  </SheetTitle>
                  <SheetDescription>
                    Atur logo resmi, nama, jenis organisasi, serta alamat dan kontak kop tagihan invoice.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4 flex-1">
                  {/* Upload Logo Lembaga */}
                  <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20">
                    <Label className="text-xs font-semibold text-foreground">
                      Logo Lembaga & Favicon Browser
                    </Label>
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.faviconUrl || DEFAULT_FAVICON_URL}
                        alt="Logo Lembaga preview"
                        className="size-14 rounded-xl border p-2 object-contain bg-white dark:bg-neutral-800 shadow-2xs shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label
                            htmlFor="sheet-logo-file"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent cursor-pointer shadow-2xs"
                          >
                            <UploadCloud className="size-3.5" />
                            Unggah Logo
                          </Label>
                          <input
                            id="sheet-logo-file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFaviconUpload}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={resetFavicon}
                          >
                            Gunakan Bawaan
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Maksimal 256 KB. Logo ini tampil pada kop invoice tagihan dan ikon tab browser.
                        </p>
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-xs text-destructive font-medium">{uploadError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-name">Nama Organisasi / Lembaga</Label>
                    <Input
                      id="org-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Contoh: LPQ Tarbiyatul Ummah"
                    />
                    <div className="rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Globe className="size-3.5 text-primary shrink-0" />
                      <span>
                        Judul tab browser otomatis:{" "}
                        <strong className="text-foreground font-semibold">
                          Sistem Absensi {formData.name.trim() || "-"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-type">Label / Jenis Organisasi</Label>
                    <Input
                      id="org-type"
                      value={formData.typeLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, typeLabel: e.target.value }))
                      }
                      placeholder="Contoh: LPQ, TPQ, Pesantren"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-address">Alamat Lembaga (Kop Invoice)</Label>
                    <Input
                      id="org-address"
                      value={formData.address ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Contoh: Jl. Melati No. 15, Surabaya"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-phone">Kontak / No. WhatsApp (Kop Invoice)</Label>
                    <Input
                      id="org-phone"
                      value={formData.phone ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Contoh: 0812-3456-7890"
                    />
                  </div>
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSheet(null)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveCurrentSection}
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </SheetFooter>
              </>
            )}

            {/* 3. Sheet: Istilah & Bahasa Aplikasi */}
            {activeSheet === "terms" && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Languages className="size-5 text-purple-600" />
                    Istilah & Bahasa Aplikasi
                  </SheetTitle>
                  <SheetDescription>
                    Sesuaikan istilah yang dipakai di seluruh menu (santri, guru, jilid, atau iuran).
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4 flex-1">
                  <div className="space-y-1.5">
                    <Label>Sebutan Peserta / Murid</Label>
                    <Input
                      value={formData.studentSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          studentSingularTitle: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Santri, Siswa, Murid"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sebutan Pengajar / Pembina</Label>
                    <Input
                      value={formData.mentorSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mentorSingularTitle: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Guru, Ustadz, Pembina"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sebutan Tingkatan / Kelas</Label>
                    <Input
                      value={formData.levelSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          levelSingularTitle: e.target.value,
                        }))
                      }
                      placeholder="Contoh: Jilid, Kelas, Sabuk"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Label Pembayaran Tagihan</Label>
                    <Input
                      value={formData.paymentLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentLabel: e.target.value,
                        }))
                      }
                      placeholder="Contoh: SPP, Syahriah, Iuran"
                    />
                  </div>
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSheet(null)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveCurrentSection}
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </SheetFooter>
              </>
            )}

            {/* 4. Sheet: Kategori & Multi-Tarif SPP */}
            {activeSheet === "tariffs" && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Coins className="size-5 text-emerald-600" />
                    Kategori & Tarif {formData.paymentLabel || "SPP"}
                  </SheetTitle>
                  <SheetDescription>
                    Kelola beberapa pilihan tarif bulanan (misal: Reguler, Tahfidz, dsb.).
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4 flex-1 overflow-y-auto">
                  {/* Daftar Tarif Tersimpan */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Daftar Tarif Aktif
                    </Label>
                    {formData.feeCategories.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                        Belum ada kategori tarif. Tambahkan di bawah.
                      </div>
                    ) : (
                      formData.feeCategories.map((cat) => {
                        const linkedType = santriTypes.find(
                          (t) => t.id === cat.santriTypeId,
                        );

                        return (
                          <div
                            key={cat.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              cat.isDefault
                                ? "border-primary/40 bg-primary/5"
                                : "bg-card"
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                  {cat.name}
                                </span>
                                {cat.isDefault && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-primary/10 text-primary border-primary/20"
                                  >
                                    Tarif Utama
                                  </Badge>
                                )}
                              </div>
                              <p className="font-mono font-semibold text-xs text-primary">
                                {formatRupiah(cat.amount)}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {" "}
                                  / bulan
                                </span>
                              </p>
                              {linkedType && (
                                <p className="text-[10px] text-muted-foreground">
                                  Otomatis untuk tipe:{" "}
                                  <strong className="text-foreground">
                                    {linkedType.nama}
                                  </strong>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {!cat.isDefault && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleSetDefaultTariff(cat.id)}
                                >
                                  Jadikan Utama
                                </Button>
                              )}
                              {formData.feeCategories.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveTariff(cat.id)}
                                  title="Hapus Kategori"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} size={15} />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Form Tambah Tarif Baru */}
                  <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      + Tambah Kategori Tarif Baru
                    </span>
                    <div className="space-y-2.5">
                      <div>
                        <Label className="text-xs">Nama Kategori Tarif</Label>
                        <Input
                          value={newTariffName}
                          onChange={(e) => setNewTariffName(e.target.value)}
                          placeholder="Contoh: Tahfidz / Reguler / Beasiswa"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nominal Bulanan (Rp)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={5000}
                          value={newTariffAmount}
                          onChange={(e) =>
                            setNewTariffAmount(
                              e.target.value === "" ? "" : Number(e.target.value),
                            )
                          }
                          placeholder="Contoh: 100000"
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">
                          Tautkan ke Tipe Santri (Opsional)
                        </Label>
                        <select
                          value={newTariffTipeId}
                          onChange={(e) => setNewTariffTipeId(e.target.value)}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- Tanpa Tautan (Pilih Manual) --</option>
                          {santriTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              Santri Tipe: {t.nama}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Jika ditautkan, santri dengan tipe ini otomatis terisi tarif ini saat dibuatkan invoice.
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newTariffIsDefault}
                            onChange={(e) => setNewTariffIsDefault(e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary/20"
                          />
                          Jadikan tarif default utama
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAddTariff}
                          disabled={
                            !newTariffName.trim() ||
                            newTariffAmount === "" ||
                            Number(newTariffAmount) < 0
                          }
                          className="h-7 text-xs gap-1.5"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} size={14} />
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSheet(null)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveCurrentSection}
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </SheetFooter>
              </>
            )}

            {/* 5. Sheet: Rekening Pembayaran & Kop Tagihan */}
            {activeSheet === "bank" && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <CreditCard className="size-5 text-amber-600" />
                    Rekening Pembayaran & Catatan
                  </SheetTitle>
                  <SheetDescription>
                    Kelola rekening tujuan transfer dan instruksi pembayaran yang tercetak di invoice.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4 flex-1 overflow-y-auto">
                  <div className="space-y-1.5">
                    <Label>Judul Header Tagihan</Label>
                    <Input
                      value={formData.invoiceTitle ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          invoiceTitle: e.target.value,
                        }))
                      }
                      placeholder="Contoh: INVOICE TAGIHAN SPP"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  {/* List of Accounts */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Daftar Rekening Transfer
                    </Label>
                    {formData.paymentAccounts.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                        Belum ada rekening pembayaran tersimpan.
                      </div>
                    ) : (
                      formData.paymentAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            acc.isDefault
                              ? "border-primary/40 bg-primary/5"
                              : "bg-card"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{acc.bankName}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {acc.accountNumber}
                              </span>
                              {acc.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-primary/10 text-primary border-primary/20"
                                >
                                  Utama
                                </Badge>
                              )}
                            </div>
                            {acc.accountHolder && (
                              <p className="text-xs text-muted-foreground">
                                a.n. {acc.accountHolder}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!acc.isDefault && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleSetDefaultAccount(acc.id)}
                              >
                                Jadikan Utama
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemovePaymentAccount(acc.id)}
                              title="Hapus Rekening"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={15} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form Tambah Rekening */}
                  <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      + Tambah Rekening Baru
                    </span>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Nama Bank / E-Wallet</Label>
                        <Input
                          value={newBank}
                          onChange={(e) => setNewBank(e.target.value)}
                          placeholder="BSI / BCA / GoPay"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nomor Rekening / No. HP</Label>
                        <Input
                          value={newAccNum}
                          onChange={(e) => setNewAccNum(e.target.value)}
                          placeholder="7123456789"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Atas Nama (A/N)</Label>
                        <Input
                          value={newHolder}
                          onChange={(e) => setNewHolder(e.target.value)}
                          placeholder="Nama pemilik rekening"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newIsDefault}
                            onChange={(e) => setNewIsDefault(e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary/20"
                          />
                          Jadikan rekening utama
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAddPaymentAccount}
                          disabled={!newBank.trim() || !newAccNum.trim()}
                          className="h-7 text-xs gap-1.5"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} size={14} />
                          Tambah Rekening
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Pembayaran Default */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <Label className="text-xs font-semibold">
                      Catatan / Instruksi Pembayaran Default
                    </Label>
                    <Textarea
                      value={formData.paymentInstructions ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentInstructions: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Mohon sertakan nama santri pada berita transfer dan kirimkan bukti ke WhatsApp pengurus..."
                      className="text-xs"
                    />
                  </div>
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSheet(null)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveCurrentSection}
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default OrganizationTermsView;
