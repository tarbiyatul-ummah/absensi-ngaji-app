import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AccountSetting02Icon,
  DatabaseIcon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "../components/master/ConfirmModal";
import { Toast } from "../components/master/Toast";
import {
  dashboardMenuItems,
  useOrganizationConfig,
  useTerms,
} from "../config/organization";
import {
  createAcademicYear,
  deleteAcademicYear as removeAcademicYear,
  getAcademicYears,
  setActiveAcademicYear,
  updateAcademicYear,
} from "../services/academicYearService";
import { getCurrentUser, supabase } from "../services/supabase";
import {
  hasSeenAccountSetupOnboarding,
  markAccountSetupOnboardingSeen,
} from "../services/onboardingService";
import type { AcademicYear } from "../types";
import {
  getAcademicYearLabel,
  getCurrentAcademicYearStart,
} from "../utils/academicPeriod";

export const AccountView: React.FC = () => {
  const router = useNavigate();
  const location = useLocation();
  const organizationConfig = useOrganizationConfig();
  const terms = useTerms();

  const activeFeatureItems = useMemo(
    () => dashboardMenuItems.filter((item) => item.enabled),
    []
  );

  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearStartInput, setAcademicYearStartInput] = useState(
    getCurrentAcademicYearStart()
  );
  const [isAddAcademicYearOpen, setIsAddAcademicYearOpen] = useState(false);
  const [isAccountOnboardingOpen, setIsAccountOnboardingOpen] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] =
    useState<AcademicYear | null>(null);
  const [editAcademicYearStartInput, setEditAcademicYearStartInput] = useState(
    getCurrentAcademicYearStart()
  );
  const [deletingAcademicYear, setDeletingAcademicYear] =
    useState<AcademicYear | null>(null);
  const [isAcademicYearLoading, setIsAcademicYearLoading] = useState(false);
  const [isAcademicYearSaving, setIsAcademicYearSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const accountEmail = currentUserEmail || `Admin ${organizationConfig.typeLabel}`;

  const sortedAcademicYears = useMemo(
    () => [...academicYears].sort((a, b) => b.startYear - a.startYear),
    [academicYears]
  );

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
    },
    []
  );

  const loadAcademicYears = useCallback(async () => {
    setIsAcademicYearLoading(true);
    try {
      const res = await getAcademicYears();
      setAcademicYears(res);
    } catch (error) {
      triggerToast(
        "Tahun ajaran belum bisa dimuat. Jalankan supabase/academic_year_schema.sql atau schema.sql terbaru di Supabase.",
        "error"
      );
    } finally {
      setIsAcademicYearLoading(false);
    }
  }, [triggerToast]);

  const resetAcademicYearForm = () => {
    setAcademicYearStartInput(getCurrentAcademicYearStart());
  };

  const openAddAcademicYearModal = () => {
    resetAcademicYearForm();
    setIsAddAcademicYearOpen(true);
  };

  const handleSubmitAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const startYear = Number(academicYearStartInput);

    if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
      triggerToast("Tahun awal harus berupa angka 2000 sampai 2100.", "error");
      return;
    }

    setIsAcademicYearSaving(true);
    try {
      await createAcademicYear(startYear);
      setIsAddAcademicYearOpen(false);
      triggerToast("Tahun ajaran berhasil ditambahkan.");
      resetAcademicYearForm();
      await loadAcademicYears();
    } catch (error) {
      triggerToast("Tahun ajaran gagal disimpan.", "error");
    } finally {
      setIsAcademicYearSaving(false);
    }
  };

  const startEditAcademicYear = (academicYear: AcademicYear) => {
    setEditingAcademicYear(academicYear);
    setEditAcademicYearStartInput(academicYear.startYear);
  };

  const handleUpdateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcademicYear) return;

    const startYear = Number(editAcademicYearStartInput);

    if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
      triggerToast("Tahun awal harus berupa angka 2000 sampai 2100.", "error");
      return;
    }

    setIsAcademicYearSaving(true);
    try {
      await updateAcademicYear(editingAcademicYear.id, startYear);
      setEditingAcademicYear(null);
      await loadAcademicYears();
      triggerToast("Tahun ajaran berhasil diperbarui.");
    } catch (error) {
      triggerToast("Tahun ajaran gagal diperbarui.", "error");
    } finally {
      setIsAcademicYearSaving(false);
    }
  };

  const handleSetActiveAcademicYear = async (academicYear: AcademicYear) => {
    setIsAcademicYearSaving(true);
    try {
      await setActiveAcademicYear(academicYear.id);
      await loadAcademicYears();
      triggerToast("Tahun ajaran aktif berhasil diganti.");
    } catch (error) {
      triggerToast("Tahun ajaran aktif gagal diganti.", "error");
    } finally {
      setIsAcademicYearSaving(false);
    }
  };

  const handleDeleteAcademicYear = async () => {
    if (!deletingAcademicYear) return;

    setIsAcademicYearSaving(true);
    try {
      await removeAcademicYear(deletingAcademicYear.id);
      if (editingAcademicYear?.id === deletingAcademicYear.id) {
        setEditingAcademicYear(null);
      }
      setDeletingAcademicYear(null);
      resetAcademicYearForm();
      await loadAcademicYears();
      triggerToast("Tahun ajaran berhasil dihapus.");
    } catch (error) {
      triggerToast("Tahun ajaran gagal dihapus.", "error");
    } finally {
      setIsAcademicYearSaving(false);
    }
  };

  const closeAccountOnboarding = async () => {
    setIsAccountOnboardingOpen(false);
    await markAccountSetupOnboardingSeen();
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const user = await getCurrentUser();
      if (!mounted) return;
      setCurrentUserEmail(user?.email ?? "");
      await loadAcademicYears();

      const searchParams = new URLSearchParams(location.search);
      if (
        searchParams.get("onboarding") === "setup" &&
        !(await hasSeenAccountSetupOnboarding())
      ) {
        if (mounted) setIsAccountOnboardingOpen(true);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [loadAcademicYears, location.search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router("/login");
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

      <div className="app-container space-y-4">
        <PageHeader
          title="Akun"
          subtitle="Kelola identitas organisasi, istilah aplikasi, dan sesi admin."
        />

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Pengaturan Organisasi</CardTitle>
            <CardDescription>
              Identitas lembaga, tampilan browser, dan bahasa aplikasi.
            </CardDescription>
          </CardHeader>

          <CardContent className="divide-y p-0">
            <section className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organisasi
              </p>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <HugeiconsIcon icon={AccountSetting02Icon} size={24} strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {organizationConfig.typeLabel}
                  </p>
                  <h2 className="truncate text-base font-bold text-foreground">
                    {organizationConfig.name}
                  </h2>
                  <p className="mt-1 truncate text-[13px] text-muted-foreground">
                    Login sebagai {accountEmail}
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tampilan Web
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={organizationConfig.faviconUrl}
                  alt="Favicon aktif"
                  className="h-12 w-12 rounded-lg border bg-muted object-contain p-1"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {organizationConfig.appTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Title dan favicon yang tampil di browser
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bahasa Aplikasi
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
                  <p className="text-xs text-muted-foreground">Peserta</p>
                  <p className="text-sm font-semibold text-foreground">
                    {terms.studentSingularTitle}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
                  <p className="text-xs text-muted-foreground">Pengajar/Pembina</p>
                  <p className="text-sm font-semibold text-foreground">
                    {terms.mentorSingularTitle}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
                  <p className="text-xs text-muted-foreground">Tingkatan</p>
                  <p className="text-sm font-semibold text-foreground">
                    {terms.levelSingularTitle}
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
          <CardFooter className="border-t p-4">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/akun/istilah">Edit Pengaturan</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Academic Year Card */}
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Tahun Ajaran</CardTitle>
                <CardDescription>
                  Atur tahun ajaran yang dipakai untuk filter semester, report,
                  dan keuangan.
                </CardDescription>
              </div>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={isAcademicYearSaving}
                onClick={openAddAcademicYearModal}
              >
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Tambah Tahun Ajaran
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            {isAcademicYearLoading ? (
              <div className="rounded-xl border border-border px-4 py-8 text-center">
                <LoadingState size="sm" text="Memuat Data" className="py-0" />
              </div>
            ) : sortedAcademicYears.length > 0 ? (
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {sortedAcademicYears.map((academicYear) => (
                  <div
                    key={academicYear.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {getAcademicYearLabel(academicYear.startYear)}
                        </p>
                        {academicYear.isActive && (
                          <Badge variant="success">Aktif</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {academicYear.startYear} - {academicYear.startYear + 1}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!academicYear.isActive && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isAcademicYearSaving}
                          onClick={() => handleSetActiveAcademicYear(academicYear)}
                        >
                          <Check className="h-4 w-4" strokeWidth={1.8} />
                          Jadikan Aktif
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isAcademicYearSaving}
                        onClick={() => startEditAcademicYear(academicYear)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.8} />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-danger hover:bg-danger-subtle hover:text-danger"
                        disabled={isAcademicYearSaving}
                        onClick={() => setDeletingAcademicYear(academicYear)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  Belum ada tahun ajaran.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tambahkan tahun ajaran agar pilihan periode bisa dikelola dari
                  Akun.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Master Data Card */}
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Data Master</CardTitle>
            <CardDescription>
              Kelola pilihan {terms.levelSingularLower},{" "}
              {terms.mentorSingularLower}, dan tipe peserta.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <HugeiconsIcon icon={DatabaseIcon} size={21} strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Master Data
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Data ini dipakai saat tambah dan import{" "}
                    {terms.studentSingularLower}.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/master-guru">Kelola Master Data</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Features */}
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Menu Aktif</CardTitle>
            <CardDescription>
              Fitur yang tersedia di dashboard organisasi saat ini.
            </CardDescription>
          </CardHeader>

          <div className="divide-y divide-border">
            {activeFeatureItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Session / Logout */}
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Sesi</CardTitle>
            <CardDescription>
              Keluar dari perangkat ini saat selesai mengelola data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center text-danger hover:bg-danger-subtle hover:text-danger hover:border-danger-border"
              onClick={handleLogout}
            >
              <HugeiconsIcon icon={Logout03Icon} size={18} strokeWidth={1.7} />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={Boolean(deletingAcademicYear)}
        title="Hapus Tahun Ajaran?"
        message={`Tahun ajaran ${
          deletingAcademicYear
            ? getAcademicYearLabel(deletingAcademicYear.startYear)
            : ""
        } akan dihapus dari pengaturan.`}
        confirmText={isAcademicYearSaving ? "Menghapus..." : "Hapus"}
        onConfirm={handleDeleteAcademicYear}
        onCancel={() => setDeletingAcademicYear(null)}
      />

      {/* Dialog Add Academic Year */}
      <Dialog
        open={isAddAcademicYearOpen}
        onOpenChange={(open) => {
          if (!open && !isAcademicYearSaving) setIsAddAcademicYearOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
            <DialogDescription>
              Isi tahun awal untuk membuat pilihan periode baru.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitAcademicYear}>
            <div className="space-y-1.5">
              <Label>Tahun Awal</Label>
              <Input
                value={academicYearStartInput}
                onChange={(e) =>
                  setAcademicYearStartInput(Number(e.target.value))
                }
                type="number"
                min={2000}
                max={2100}
                step={1}
                placeholder="Contoh: 2026"
              />
              <p className="text-xs text-muted-foreground">
                Akan tampil sebagai{" "}
                {getAcademicYearLabel(
                  Number(academicYearStartInput) ||
                    getCurrentAcademicYearStart()
                )}
                .
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isAcademicYearSaving}
                onClick={() => setIsAddAcademicYearOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isAcademicYearSaving}>
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                {isAcademicYearSaving ? "Menambahkan..." : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Account Onboarding */}
      <Dialog
        open={isAccountOnboardingOpen}
        onOpenChange={(open) => {
          if (!open) closeAccountOnboarding();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Panduan Setup Akun</DialogTitle>
            <DialogDescription>
              Lengkapi bagian penting ini sebelum mulai menambahkan siswa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="font-semibold text-foreground">Tahun Ajaran</p>
              <p className="mt-1 text-muted-foreground">
                Buat dan pilih tahun ajaran aktif untuk report penilaian, SPP,
                tabungan, export, dan dashboard.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-semibold text-foreground">Data Master</p>
              <p className="mt-1 text-muted-foreground">
                Isi tingkat, pengajar, dan tipe siswa agar form siswa dan filter
                data siap dipakai.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-semibold text-foreground">Bahasa Aplikasi</p>
              <p className="mt-1 text-muted-foreground">
                Sesuaikan istilah seperti siswa, guru, tingkat, dan label SPP
                dengan kebiasaan lembaga.
              </p>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={closeAccountOnboarding}>
            Mengerti
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Academic Year */}
      <Dialog
        open={Boolean(editingAcademicYear)}
        onOpenChange={(open) => {
          if (!open && !isAcademicYearSaving) setEditingAcademicYear(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tahun Ajaran</DialogTitle>
            <DialogDescription>
              Ubah tahun awal untuk memperbarui label tahun ajaran.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateAcademicYear}>
            <div className="space-y-1.5">
              <Label>Tahun Awal</Label>
              <Input
                value={editAcademicYearStartInput}
                onChange={(e) =>
                  setEditAcademicYearStartInput(Number(e.target.value))
                }
                type="number"
                min={2000}
                max={2100}
                step={1}
                placeholder="Contoh: 2026"
              />
              <p className="text-xs text-muted-foreground">
                Akan tampil sebagai{" "}
                {getAcademicYearLabel(
                  Number(editAcademicYearStartInput) ||
                    getCurrentAcademicYearStart()
                )}
                .
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isAcademicYearSaving}
                onClick={() => setEditingAcademicYear(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isAcademicYearSaving}>
                <Check className="h-4 w-4" strokeWidth={1.8} />
                {isAcademicYearSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountView;
