import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { springSnappy, useSmoothMotion } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import { ConfirmModal } from "../components/master/ConfirmModal";
import { SavingsAccountFormDialog } from "../components/savings/SavingsAccountFormDialog";
import { Toast } from "../components/master/Toast";
import { useTerms } from "../config/organization";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  deleteSavingsAccount,
  getSavingsAccountById,
  getSavingsPaymentId,
  getSavingsPaymentsByAccount,
  saveSavingsPayment,
  updateSavingsAccount,
} from "../services/savingsService";
import type {
  Guru,
  Jilid,
  Santri,
  SavingsAccount,
  SavingsAccountFormData,
  SavingsPayment,
} from "../types";
import {
  type AcademicSemester,
  getAcademicMonthOptions,
  getAcademicYearLabel,
  getCurrentAcademicMonth,
} from "../utils/academicPeriod";

export const SavingsDetailView: React.FC = () => {
  const { id: routeAccountId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const accountId = routeAccountId ?? "";

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [account, setAccount] = useState<SavingsAccount | null>(null);
  const [paymentList, setPaymentList] = useState<SavingsPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingPaymentIds, setSavingPaymentIds] = useState<Set<string>>(
    new Set()
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    []
  );

  const sortedSantriList = useMemo(() => {
    return [...santriList].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [santriList]);

  const selectedSavingsMonthOptions = useMemo(() => {
    if (!account) return [];
    const monthOptions = getAcademicMonthOptions(account.academicYearStart);
    return account.semester === "ganjil"
      ? monthOptions.slice(0, 6)
      : monthOptions.slice(6);
  }, [account]);

  const paymentByKey = useMemo(() => {
    return paymentList.reduce(
      (acc, payment) => {
        acc[`${payment.santriId}_${payment.month}`] = payment;
        return acc;
      },
      {} as Record<string, SavingsPayment>
    );
  }, [paymentList]);

  const selectedSavingsSantriList = useMemo(() => {
    if (!account) return [];
    const selectedIds = new Set(account.santriIds);
    return sortedSantriList.filter((santri) => selectedIds.has(santri.id));
  }, [account, sortedSantriList]);

  const currentSavingsMonthValue = useMemo(
    () => getCurrentAcademicMonth(),
    []
  );

  const currentSavingsMonthLabel = useMemo(() => {
    return (
      selectedSavingsMonthOptions.find(
        (month) => month.value === currentSavingsMonthValue
      )?.label ?? "bulan ini"
    );
  }, [selectedSavingsMonthOptions, currentSavingsMonthValue]);

  const currentSavingsMonthIndex = useMemo(() => {
    return selectedSavingsMonthOptions.findIndex(
      (month) => month.value === currentSavingsMonthValue
    );
  }, [selectedSavingsMonthOptions, currentSavingsMonthValue]);

  const previousSavingsMonthValue = useMemo(() => {
    if (currentSavingsMonthIndex <= 0) return null;
    return selectedSavingsMonthOptions[currentSavingsMonthIndex - 1]?.value ?? null;
  }, [selectedSavingsMonthOptions, currentSavingsMonthIndex]);

  const isSavingsPaid = useCallback(
    (santriId: string, month: string) => {
      return paymentByKey[`${santriId}_${month}`]?.isPaid === true;
    },
    [paymentByKey]
  );

  const paidThisMonthCount = useMemo(() => {
    return selectedSavingsSantriList.filter((santri) =>
      isSavingsPaid(santri.id, currentSavingsMonthValue)
    ).length;
  }, [selectedSavingsSantriList, isSavingsPaid, currentSavingsMonthValue]);

  const savingsArrearsCount = useMemo(() => {
    if (!previousSavingsMonthValue) return 0;
    return selectedSavingsSantriList.filter(
      (santri) => !isSavingsPaid(santri.id, previousSavingsMonthValue)
    ).length;
  }, [selectedSavingsSantriList, isSavingsPaid, previousSavingsMonthValue]);

  const editInitialValue = useMemo<SavingsAccountFormData | null>(() => {
    if (!account) return null;
    return {
      name: account.name,
      academicYearStart: account.academicYearStart,
      semester: account.semester,
      mode: account.mode,
      santriIds: account.santriIds,
    };
  }, [account]);

  const jilidMap = useMemo(
    () => new Map(jilidList.map((j) => [j.id, j.nama])),
    [jilidList]
  );

  const guruMap = useMemo(
    () => new Map(guruList.map((g) => [g.id, g.nama])),
    [guruList]
  );

  const getJilidName = useCallback(
    (jilidId: string) => jilidMap.get(jilidId) ?? "-",
    [jilidMap]
  );

  const getGuruName = useCallback(
    (guruId: string) => guruMap.get(guruId) ?? "-",
    [guruMap]
  );

  const semesterLabel = (semester: AcademicSemester) =>
    semester === "ganjil" ? "Ganjil" : "Genap";

  const getSavingsPaidCount = useCallback(
    (santriId: string) => {
      return selectedSavingsMonthOptions.filter((month) =>
        isSavingsPaid(santriId, month.value)
      ).length;
    },
    [selectedSavingsMonthOptions, isSavingsPaid]
  );

  const formatMonthShort = (monthLabel: string) =>
    monthLabel.split(" ")[0].slice(0, 3);

  const loadPayments = useCallback(
    async (accId: string) => {
      if (!accId) return;
      setIsPaymentLoading(true);
      try {
        const payments = await getSavingsPaymentsByAccount(accId);
        setPaymentList(payments);
      } catch (error) {
        triggerToast("Data pembayaran tabungan belum bisa dimuat.", "error");
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [triggerToast]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [santriRes, jilidRes, guruRes, accountRes] = await Promise.all([
        getSantri(),
        getJilid(),
        getGuru(),
        getSavingsAccountById(accountId),
      ]);
      setSantriList(santriRes);
      setJilidList(jilidRes);
      setGuruList(guruRes);
      setAccount(accountRes);

      if (!accountRes) {
        triggerToast("Tabungan tidak ditemukan.", "error");
        return;
      }

      await loadPayments(accountId);
    } catch (error) {
      triggerToast(
        "Koneksi bermasalah. Detail tabungan belum bisa dimuat.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [accountId, loadPayments, triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click outside to close actions dropdown
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const openEditModal = () => {
    if (!account) return;
    setIsActionsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = () => {
    if (!account) return;
    setIsActionsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateSavings = async (data: SavingsAccountFormData) => {
    if (!account) return;

    setIsSaving(true);
    try {
      await updateSavingsAccount(account.id, data);
      const updated = await getSavingsAccountById(account.id);
      setAccount(updated);
      setIsEditModalOpen(false);
      triggerToast("Tabungan berhasil diperbarui.");
    } catch (error) {
      triggerToast("Tabungan gagal diperbarui.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSavingsPayment = async (santri: Santri, month: string) => {
    if (!account) return;

    const id = getSavingsPaymentId(account.id, month, santri.id);
    const previousPayments = [...paymentList];
    const nextIsPaid = !isSavingsPaid(santri.id, month);
    const nextPayment: SavingsPayment = {
      id,
      savingsAccountId: account.id,
      santriId: santri.id,
      academicYearStart: account.academicYearStart,
      semester: account.semester,
      month,
      isPaid: nextIsPaid,
      paidAt: nextIsPaid ? Date.now() : null,
      updatedAt: Date.now(),
    };

    setPaymentList((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = nextPayment;
        return copy;
      }
      return [...prev, nextPayment];
    });

    setSavingPaymentIds((prev) => new Set(prev).add(id));

    try {
      await saveSavingsPayment({
        savingsAccountId: account.id,
        santriId: santri.id,
        academicYearStart: account.academicYearStart,
        semester: account.semester,
        month,
        isPaid: nextIsPaid,
        paidAt: nextPayment.paidAt,
      });
    } catch (error) {
      setPaymentList(previousPayments);
      triggerToast("Pembayaran tabungan gagal disimpan.", "error");
    } finally {
      setSavingPaymentIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteSavings = async () => {
    if (!account) return;

    setIsDeleting(true);
    try {
      await deleteSavingsAccount(account.id);
      setIsDeleteModalOpen(false);
      navigate("/tabungan");
    } catch (error) {
      triggerToast("Tabungan gagal dihapus.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-page">
      {toastMessage && (
        <Toast
          show={!!toastMessage}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="app-container-wide space-y-5">
        {isLoading ? (
          <LoadingState size="lg" text="Memuat Data" />
        ) : account ? (
          <main className="space-y-5">
            <PageHeader
              title={account.name}
              subtitle={`${getAcademicYearLabel(account.academicYearStart)} • Semester ${semesterLabel(account.semester)}`}
              backTo="/tabungan"
              actions={
                <div ref={actionsMenuRef} className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsActionsMenuOpen((prev) => !prev);
                    }}
                  >
                    <MoreVertical
                      className="h-4 w-4"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    Lainnya
                  </Button>

                  {isActionsMenuOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-44 overflow-hidden rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-accent/70 hover:text-foreground"
                        onClick={openEditModal}
                      >
                        <Pencil
                          className="h-3.5 w-3.5 text-muted-foreground"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        Edit Tabungan
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-danger transition-colors hover:bg-danger-subtle"
                        onClick={openDeleteModal}
                      >
                        <Trash2
                          className="h-3.5 w-3.5 text-danger"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              }
            />

            <Card className="grid grid-cols-1 sm:grid-cols-3 gap-0 py-0 overflow-hidden">
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <p className="text-xs leading-snug text-muted-foreground">
                  Terdaftar
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">
                  {selectedSavingsSantriList.length}
                </p>
              </div>
              <div className="border-b p-4 sm:border-b-0 sm:border-r">
                <p className="text-xs leading-snug text-muted-foreground">
                  Sudah bayar bulan ini
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-success">
                  {paidThisMonthCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {{ ...account }.semester ? currentSavingsMonthLabel : ""}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs leading-snug text-muted-foreground">
                  Jumlah menunggak
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-danger">
                  {savingsArrearsCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Belum bayar bulan sebelumnya
                </p>
              </div>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle>Tracking Pembayaran</CardTitle>
                <CardDescription>
                  Checklist pembayaran tabungan bulanan untuk semester ini.
                </CardDescription>
              </CardHeader>

              {isPaymentLoading && (
                <div className="border-t px-4 py-3 text-center">
                  <LoadingState size="sm" text="Memuat Data" className="py-0" />
                </div>
              )}

              {/* Mobile list */}
              <div className="space-y-3 p-4 md:hidden">
                {selectedSavingsSantriList.map((santri) => (
                  <article
                    key={santri.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-2xs"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-foreground">
                          {santri.nama}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {getJilidName(santri.jilidId)} -{" "}
                          {getGuruName(santri.guruId)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {getSavingsPaidCount(santri.id)}/
                        {selectedSavingsMonthOptions.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {selectedSavingsMonthOptions.map((month) => {
                        const paid = isSavingsPaid(santri.id, month.value);
                        const isSavingThis = savingPaymentIds.has(
                          getSavingsPaymentId(
                            account.id,
                            month.value,
                            santri.id
                          )
                        );

                        return (
                          <motion.button
                            key={`${santri.id}-${month.value}`}
                            type="button"
                            whileTap={
                              shouldReduceMotion || isSavingThis
                                ? undefined
                                : { scale: 0.98 }
                            }
                            transition={springSnappy}
                            onClick={() =>
                               toggleSavingsPayment(santri, month.value)
                            }
                            disabled={isSavingThis}
                            className={`flex h-12 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                              paid
                                ? "border-success-border bg-success-subtle text-success shadow-2xs"
                                : "border-border bg-muted/40 text-muted-foreground active:bg-accent/70"
                            }`}
                          >
                            <span>{formatMonthShort(month.label)}</span>
                            <span className="mt-0.5 text-[10px]">
                              {paid ? "Bayar" : "Belum"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </article>
                ))}

                {selectedSavingsSantriList.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada {terms.studentSingularLower} di tabungan ini.
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto border-t md:block">
                <table className="min-w-[760px] w-full border-collapse text-left text-[13px]">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="sticky left-0 z-10 w-56 bg-muted px-4 py-3 font-semibold">
                        {terms.studentSingularTitle}
                      </th>
                      {selectedSavingsMonthOptions.map((month) => (
                        <th
                          key={month.value}
                          className="w-20 px-2 py-3 text-center font-semibold"
                        >
                          {formatMonthShort(month.label)}
                        </th>
                      ))}
                      <th className="w-24 px-3 py-3 text-right font-semibold">
                        Bayar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedSavingsSantriList.map((santri) => (
                      <tr key={santri.id} className="hover:bg-accent">
                        <td className="sticky left-0 z-10 bg-background px-4 py-3">
                          <p className="font-medium text-foreground">
                            {santri.nama}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {getJilidName(santri.jilidId)} -{" "}
                            {getGuruName(santri.guruId)}
                          </p>
                        </td>
                        {selectedSavingsMonthOptions.map((month) => {
                          const paid = isSavingsPaid(santri.id, month.value);
                          const isSavingThis = savingPaymentIds.has(
                            getSavingsPaymentId(
                              account.id,
                              month.value,
                              santri.id
                            )
                          );

                          return (
                            <td
                              key={`${santri.id}-${month.value}`}
                              className="px-2 py-2 text-center"
                            >
                              <motion.button
                                type="button"
                                whileTap={
                                  shouldReduceMotion || isSavingThis
                                    ? undefined
                                    : { scale: 0.88 }
                                }
                                transition={springSnappy}
                                onClick={() =>
                                  toggleSavingsPayment(santri, month.value)
                                }
                                disabled={isSavingThis}
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                                  paid
                                    ? "border-success-border bg-success-subtle text-success shadow-2xs"
                                    : "border-border bg-card text-muted-foreground hover:bg-accent/70"
                                }`}
                                aria-label={`${santri.nama} ${month.label}`}
                              >
                                {paid ? "L" : "-"}
                              </motion.button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-right font-semibold text-foreground">
                          {getSavingsPaidCount(santri.id)}/
                          {selectedSavingsMonthOptions.length}
                        </td>
                      </tr>
                    ))}
                    {selectedSavingsSantriList.length === 0 && (
                      <tr>
                        <td
                          colSpan={selectedSavingsMonthOptions.length + 2}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          Belum ada {terms.studentSingularLower} di tabungan ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        ) : (
          <Card>
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Tabungan tidak ditemukan.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Kembali ke daftar tabungan untuk memilih data lain.
              </p>
            </div>
          </Card>
        )}
      </div>

      <SavingsAccountFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Tabungan"
        description="Perbarui detail dan peserta yang ikut tabungan ini."
        submitText="Simpan Perubahan"
        saving={isSaving}
        initialValue={editInitialValue}
        santriList={santriList}
        jilidList={jilidList}
        guruList={guruList}
        onSubmit={handleUpdateSavings}
        onValidationError={(message) => triggerToast(message, "error")}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Tabungan?"
        message={`Tabungan ${account?.name ?? ""} dan seluruh checklist pembayarannya akan dihapus.`}
        confirmText={isDeleting ? "Menghapus..." : "Hapus Tabungan"}
        onConfirm={handleDeleteSavings}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default SavingsDetailView;
