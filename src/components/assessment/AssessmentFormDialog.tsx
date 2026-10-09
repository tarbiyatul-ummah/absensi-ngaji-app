import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  AssessmentFormData,
  AssessmentFormItem,
  AssessmentItemType,
  Guru,
  Jilid,
  Santri,
} from "@/types";

export interface AssessmentFormDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitText: string;
  saving?: boolean;
  initialValue?: AssessmentFormData | null;
  santriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: AssessmentFormData) => void;
  onValidationError: (message: string) => void;
}

export const AssessmentFormDialog: React.FC<AssessmentFormDialogProps> = ({
  open,
  title,
  description,
  submitText,
  saving = false,
  initialValue = null,
  santriList,
  jilidList,
  guruList,
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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<AssessmentFormData>(() => ({
    name: "",
    assessmentType: "score",
    minimumScore: 0,
    items: [{ label: "" }],
    santriIds: [],
  }));

  const maxScore = form.assessmentType === "scale" ? 5 : 100;

  const getDefaultValue = (): AssessmentFormData => ({
    name: "",
    assessmentType: "score",
    minimumScore: 0,
    items: [{ label: "" }],
    santriIds: activeSantriList.map((s) => s.id),
  });

  useEffect(() => {
    if (open) {
      if (initialValue) {
        setForm({
          ...initialValue,
          items: initialValue.items.map((it) => ({ ...it })),
          santriIds: [...initialValue.santriIds],
        });
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

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { label: "" }],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      onValidationError("Minimal ada 1 butir penilaian.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const updateItemLabel = (index: number, label: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) =>
        idx === index ? { ...it, label } : it,
      ),
    }));
  };

  const validateDetail = () => {
    if (!form.name.trim()) {
      onValidationError("Nama penilaian wajib diisi.");
      return false;
    }
    return true;
  };

  const validateItems = () => {
    const min = Number(form.minimumScore);
    if (Number.isNaN(min) || min < 0 || min > maxScore) {
      onValidationError(`Nilai minimum harus antara 0 dan ${maxScore}.`);
      return false;
    }

    if (form.items.length === 0) {
      onValidationError("Minimal ada 1 butir penilaian.");
      return false;
    }

    if (form.items.some((item) => !item.label.trim())) {
      onValidationError("Semua nama butir penilaian wajib diisi.");
      return false;
    }

    return true;
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step >= 2 && !validateDetail()) return;
    if (step === 3 && !validateItems()) return;
    setCurrentStep(step);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (currentStep === 1) {
      goToStep(2);
      return;
    }

    if (currentStep === 2) {
      goToStep(3);
      return;
    }

    if (!validateDetail() || !validateItems()) return;

    if (selectedSantriIds.size === 0) {
      onValidationError(`Pilih minimal 1 ${terms.studentSingularLower}.`);
      return;
    }

    onSubmit({
      name: form.name.trim(),
      assessmentType: form.assessmentType,
      minimumScore: Number(form.minimumScore),
      items: form.items.map((it) => ({
        id: it.id,
        label: it.label.trim(),
      })),
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
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
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
                onClick={() => goToStep(2)}
              >
                2. Butiran
              </button>
              <button
                type="button"
                className={`rounded px-3 py-2 text-[13px] font-semibold transition-colors ${
                  currentStep === 3
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground"
                }`}
                onClick={() => goToStep(3)}
              >
                3. Peserta
              </button>
            </div>

            {currentStep === 1 && (
              <section className="space-y-3">
                <div>
                  <Label htmlFor="assessment-name-input">Nama Penilaian</Label>
                  <Input
                    id="assessment-name-input"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    type="text"
                    placeholder="Contoh: Evaluasi Hafalan Pekanan"
                  />
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Tipe Penilaian</Label>
                    <select
                      value={form.assessmentType}
                      onChange={(e) => {
                        const newType = e.target.value as AssessmentItemType;
                        const newMax = newType === "scale" ? 5 : 100;
                        setForm({
                          ...form,
                          assessmentType: newType,
                          minimumScore:
                            form.minimumScore > newMax
                              ? newMax
                              : form.minimumScore,
                        });
                      }}
                      className="ui-select"
                    >
                      <option value="score">Nilai 0-100</option>
                      <option value="scale">Skala 1-5</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Nilai Minimum</Label>
                    <Input
                      value={form.minimumScore}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          minimumScore: Number(e.target.value),
                        })
                      }
                      type="number"
                      min={0}
                      max={maxScore}
                      step={1}
                      placeholder={
                        form.assessmentType === "scale"
                          ? "Contoh: 3"
                          : "Contoh: 70"
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Butiran Penilaian
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Butir
                  </Button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-3"
                    >
                      <div>
                        <Label className="text-xs">Butir yang Dinilai</Label>
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updateItemLabel(index, e.target.value)
                          }
                          type="text"
                          placeholder="Contoh: Kelancaran"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {currentStep === 3 && (
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
                      Kosongkan
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
                          {santri.nama}
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
                  : setCurrentStep((prev) => (prev === 3 ? 2 : 1))
              }
            >
              {currentStep === 1 ? "Batal" : "Sebelumnya"}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                currentStep < 3 ? goToStep((currentStep + 1) as 2 | 3) : handleSubmit()
              }
            >
              {currentStep < 3
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

export default AssessmentFormDialog;

