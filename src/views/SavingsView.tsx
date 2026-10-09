import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddMoneyCircleIcon,
  ArrowLeft02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SavingsAccountFormDialog } from "../components/savings/SavingsAccountFormDialog";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  addSavingsAccount,
  getSavingsAccounts,
} from "../services/savingsService";
import { getAcademicYears } from "../services/academicYearService";
import type {
  AcademicYear,
  Guru,
  Jilid,
  Santri,
  SavingsAccount,
  SavingsAccountFormData,
} from "../types";
import {
  type AcademicSemester,
  getAcademicYearLabel,
} from "../utils/academicPeriod";
import { Toast } from "../components/master/Toast";
import { useTerms } from "../config/organization";
import {
  useSmoothMotion,
  staggerContainerVariants,
  staggerItemVariants,
  springSnappy,
} from "@/lib/motion";

export const SavingsView: React.FC = () => {
  const terms = useTerms();
  const navigate = useNavigate();
  const { shouldReduceMotion } = useSmoothMotion();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [academicYearList, setAcademicYearList] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    []
  );

  const semesterLabel = (semester: AcademicSemester) =>
    semester === "ganjil" ? "Ganjil" : "Genap";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [santriRes, jilidRes, guruRes, savingsRes, academicYearRes] =
        await Promise.all([
          getSantri(),
          getJilid(),
          getGuru(),
          getSavingsAccounts(),
          getAcademicYears().catch(() => []),
        ]);
      setSantriList(santriRes);
      setJilidList(jilidRes);
      setGuruList(guruRes);
      setSavingsAccounts(savingsRes);
      setAcademicYearList(academicYearRes);
    } catch (error) {
      triggerToast(
        "Koneksi bermasalah. Data tabungan belum bisa dimuat.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSavings = async (data: SavingsAccountFormData) => {
    setIsSaving(true);
    try {
      const accountId = await addSavingsAccount(data);
      setIsAddModalOpen(false);
      navigate(`/tabungan/${accountId}`);
    } catch (error) {
      triggerToast("Tabungan gagal disimpan.", "error");
    } finally {
      setIsSaving(false);
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
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.7} />
            Dashboard
          </Link>
        </Button>

        <header className="app-header">
          <div>
            <h1 className="app-title">Tabungan</h1>
            <p className="app-subtitle">
              Buat tabungan per semester, lalu buka detail untuk tracking
              pembayaran.
            </p>
          </div>
          <Button type="button" onClick={() => setIsAddModalOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} size={17} strokeWidth={2} />
            Tambah Tabungan
          </Button>
        </header>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <main className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Tabungan</CardTitle>
                <CardDescription>
                  Klik tabungan untuk membuka tracking pembayaran.
                </CardDescription>
              </CardHeader>

              {savingsAccounts.length > 0 ? (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial={shouldReduceMotion ? false : "hidden"}
                    animate="visible"
                    className="divide-y divide-[#F1F2F3]"
                  >
                    {savingsAccounts.map((account) => (
                      <motion.div
                        key={account.id}
                        variants={staggerItemVariants}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                        transition={springSnappy}
                      >
                        <Link
                          to={`/tabungan/${account.id}`}
                          className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                              <HugeiconsIcon icon={AddMoneyCircleIcon} size={22} strokeWidth={1.7} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                {account.name}
                              </h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {getAcademicYearLabel(account.academicYearStart)} -
                                Semester {semesterLabel(account.semester)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {account.santriIds.length} {terms.studentSingularLower}
                          </Badge>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Belum ada tabungan.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Klik Tambah Tabungan untuk membuat setup pertama.
                  </p>
                </div>
              )}
            </Card>
          </main>
        )}
      </div>

      <SavingsAccountFormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Tambah Tabungan"
        description={`Isi nama, semester, lalu pilih ${terms.studentSingularLower}.`}
        submitText="Selesai"
        saving={isSaving}
        santriList={santriList}
        jilidList={jilidList}
        guruList={guruList}
        academicYearList={academicYearList}
        onSubmit={handleCreateSavings}
        onValidationError={(message) => triggerToast(message, "error")}
      />
    </div>
  );
};

export default SavingsView;
