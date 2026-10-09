import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTerms } from "@/config/organization";
import { useSantriSelection } from "@/hooks/useSantriSelection";
import type {
  AcademicYear,
  Guru,
  Jilid,
  Santri,
  SavingsAccountFormData,
} from "@/types";
import {
  getAcademicYearSelectOptions,
  getDefaultAcademicYearStart,
} from "@/services/academicYearService";
import {
  type AcademicSemester,
  getCurrentAcademicYearStart,
  getCurrentSemester,
} from "@/utils/academicPeriod";

export interface SavingsAccountFormDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitText: string;
  saving?: boolean;
  initialValue?: SavingsAccountFormData | null;
  santriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[];
  academicYearList?: AcademicYear[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: SavingsAccountFormData) => void;
  onValidationError: (message: string) => void;
}

export const SavingsAccountFormDialog: React.FC<
  SavingsAccountFormDialogProps
> = ({
  open,
  title,
  description,
  submitText,
  saving = false,
  initialValue = null,
  santriList,
  jilidList,
  guruList,
  academicYearList = [],
  onOpenChange,
  onSubmit,
  onValidationError,
}) => {
  const terms = useTerms();

  const activeSantriList = useMemo(
    () =>
      santriList
        .filter((s) => s.isActive !== false)
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [santriList],
  );

  const {
    deselectAllSantri,
    filteredSantriList,
    getGuruName,
    getJilidName,
    resetFilters,
    searchQuery,
    setSearchQuery,
    selectAllSantri,
    selectedCount,
    selectedGuru,
    setSelectedGuru,
    selectedJilid,
    setSelectedJilid,
    selectedSantriIds,
    setSelectedSantriIds,
    toggleSantriSelection,
  } = useSantriSelection({
    activeSantriList,
    jilidList,
    guruList,
  });

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<SavingsAccountFormData>(() => ({
    name: "",
    academicYearStart: getCurrentAcademicYearStart(),
    semester: getCurrentSemester() as AcademicSemester,
    mode: "monthly",
    santriIds: [],
  }));

  const academicYearOptions = useMemo(
    () => getAcademicYearSelectOptions(academicYearList),
    [academicYearList],
  );

  const getDefaultValue = (): SavingsAccountFormData => ({
    name: "",
    academicYearStart: getDefaultAcademicYearStart(
      academicYearList,
      getCurrentAcademicYearStart(),
    ),
    semester: getCurrentSemester(),
    mode: "monthly",
    santriIds: activeSantriList.map((s) => s.id),
  });

  useEffect(() => {
    if (open) {
      if (initialValue) {
        setForm({ ...initialValue, santriIds: [...initialValue.santriIds] });
        setSelectedSantriIds(initialValue.santriIds);
      } else {
        const def = getDefaultValue();
        setForm(def);
        setSelectedSantriIds(def.santriIds);
      }
      setCurrentStep(1);
      resetFilters();
    }
  }, [open, initialValue, activeSantriList]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && saving) return;
    onOpenChange(nextOpen);
  };

  const goToStudentStep = () => {
    if (!form.name.trim()) {
      onValidationError("Nama tabungan wajib diisi.");
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (currentStep === 1) {
      goToStudentStep();
      return;
    }

    const name = form.name.trim();
    if (!name) {
      onValidationError("Nama tabungan wajib diisi.");
      return;
    }

    if (selectedSantriIds.size === 0) {
      onValidationError(`Pilih minimal 1 ${terms.studentSingularLower}.`);
      return;
    }

    onSubmit({
      ...form,
      name,
      santriIds: [...selectedSantriIds],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="max-h-[calc(92vh-72px)] overflow-y-auto"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5 px-5 py-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                className={`rounded px-3 py-2 text-[13px] font-semibold transition-colors ${
                  currentStep === 1
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground"
                }`}
                onClick={() => setCurrentStep(1)}
              >
                1. Detail
              </button>
              <button
                type="button"
                className={`rounded px-3 py-2 text-[13px] font-semibold transition-colors ${
                  currentStep === 2
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground"
                }`}
                onClick={goToStudentStep}
              >
                2. Peserta
              </button>
            </div>

            {currentStep === 1 && (
              <section className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="savings-name-input">Nama Tabungan</Label>
                    <Input
                      id="savings-name-input"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      type="text"
                      placeholder="Contoh: Tabungan Semester Ganjil"
                    />
                  </div>

                  <div>
                    <Label htmlFor="savings-academic-year">Tahun Ajaran</Label>
                    <select
                      id="savings-academic-year"
                      value={form.academicYearStart}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          academicYearStart: Number(e.target.value),
                        })
                      }
                      className="ui-select"
                    >
                      {academicYearOptions.map((year) => (
                        <option key={year.startYear} value={year.startYear}>
                          {year.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="savings-semester">Semester</Label>
                    <select
                      id="savings-semester"
                      value={form.semester}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          semester: e.target.value as AcademicSemester,
                        })
                      }
                      className="ui-select"
                    >
                      <option value="ganjil">Ganjil</option>
                      <option value="genap">Genap</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Pilih {terms.studentSingularTitle}
                  </h3>
                  <span className="text-xs font-semibold text-foreground">
                    {selectedCount}/{activeSantriList.length} dipilih
                  </span>
                </div>

                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="search"
                  placeholder={`Cari nama, ${terms.levelSingularLower}, atau ${terms.mentorSingularLower}...`}
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedJilid}
                    onChange={(e) => setSelectedJilid(e.target.value)}
                    className="ui-select"
                  >
                    <option value="semua">
                      Semua {terms.levelSingularTitle}
                    </option>
                    {jilidList.map((jilid) => (
                      <option key={jilid.id} value={jilid.id}>
                        {jilid.nama}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedGuru}
                    onChange={(e) => setSelectedGuru(e.target.value)}
                    className="ui-select"
                  >
                    <option value="semua">
                      Semua {terms.mentorSingularTitle}
                    </option>
                    {guruList.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {filteredSantriList.length} hasil filter
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-foreground"
                      onClick={selectAllSantri}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-muted-foreground"
                      onClick={deselectAllSantri}
                    >
                      Kosongkan Pilihan
                    </Button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                  {filteredSantriList.map((santri) => (
                    <label
                      key={santri.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-border px-3 py-3 last:border-b-0 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        checked={selectedSantriIds.has(santri.id)}
                        onChange={() => toggleSantriSelection(santri.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {{ santri }.santri.nama}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {getJilidName(santri.jilidId)} -{" "}
                          {getGuruName(santri.guruId)}
                        </span>
                      </span>
                    </label>
                  ))}

                  {filteredSantriList.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Tidak ada {terms.studentSingularLower} yang sesuai filter.
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                currentStep === 1
                  ? handleOpenChange(false)
                  : setCurrentStep(1)
              }
            >
              {currentStep === 1 ? "Batal" : "Sebelumnya"}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                currentStep === 1 ? goToStudentStep() : handleSubmit()
              }
            >
              {currentStep === 1
                ? "Selanjutnya"
                : saving
                  ? "Menyimpan..."
                  : submitText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsAccountFormDialog;

