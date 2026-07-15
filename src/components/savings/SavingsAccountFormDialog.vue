<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
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
import { terms } from "../../config/organization";
import { useSantriSelection } from "../../composables/useSantriSelection";
import type {
  Guru,
  Jilid,
  Santri,
  SavingsAccountFormData,
} from "../../types";
import {
  type AcademicSemester,
  getAcademicYearOptions,
  getCurrentAcademicYearStart,
  getCurrentSemester,
} from "../../utils/academicPeriod";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description: string;
    submitText: string;
    saving?: boolean;
    initialValue?: SavingsAccountFormData | null;
    santriList: Santri[];
    jilidList: Jilid[];
    guruList: Guru[];
  }>(),
  {
    initialValue: null,
    saving: false,
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "submit", value: SavingsAccountFormData): void;
  (event: "validation-error", message: string): void;
}>();

const activeSantriList = computed(() =>
  props.santriList
    .filter((santri) => santri.isActive !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama)),
);
const jilidListRef = toRef(props, "jilidList");
const guruListRef = toRef(props, "guruList");

const {
  deselectAllSantri,
  filteredSantriList,
  getGuruName,
  getJilidName,
  resetFilters,
  searchQuery,
  selectAllSantri,
  selectedCount,
  selectedGuru,
  selectedJilid,
  selectedSantriIds,
  setSelectedSantriIds,
  toggleSantriSelection,
} = useSantriSelection(activeSantriList, jilidListRef, guruListRef);

const currentStep = ref<1 | 2>(1);
const form = ref<SavingsAccountFormData>({
  name: "",
  academicYearStart: getCurrentAcademicYearStart(),
  semester: getCurrentSemester() as AcademicSemester,
  mode: "monthly",
  santriIds: [],
});

const academicYearOptions = computed(() =>
  getAcademicYearOptions(getCurrentAcademicYearStart()),
);

const canGoToStudentStep = computed(() => form.value.name.trim().length > 0);

const getDefaultValue = (): SavingsAccountFormData => ({
  name: "",
  academicYearStart: getCurrentAcademicYearStart(),
  semester: getCurrentSemester(),
  mode: "monthly",
  santriIds: activeSantriList.value.map((santri) => santri.id),
});

const resetForm = () => {
  form.value = props.initialValue
    ? {
        ...props.initialValue,
        santriIds: [...props.initialValue.santriIds],
      }
    : getDefaultValue();
  currentStep.value = 1;
  resetFilters();
  setSelectedSantriIds(form.value.santriIds);
};

const handleOpenChange = (open: boolean) => {
  if (!open && props.saving) return;
  emit("update:open", open);
};

const goToStudentStep = () => {
  if (!canGoToStudentStep.value) {
    emit("validation-error", "Nama tabungan wajib diisi.");
    return;
  }

  currentStep.value = 2;
};

const handleSubmit = () => {
  if (currentStep.value === 1) {
    goToStudentStep();
    return;
  }

  const name = form.value.name.trim();
  if (!name) {
    emit("validation-error", "Nama tabungan wajib diisi.");
    return;
  }

  if (selectedSantriIds.value.size === 0) {
    emit("validation-error", `Pilih minimal 1 ${terms.studentSingularLower}.`);
    return;
  }

  emit("submit", {
    ...form.value,
    name,
    santriIds: [...selectedSantriIds.value],
  });
};

const handlePrimaryAction = () => {
  if (currentStep.value === 1) {
    goToStudentStep();
    return;
  }

  handleSubmit();
};

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);

watch(activeSantriList, () => {
  if (props.open && !props.initialValue) {
    setSelectedSantriIds(activeSantriList.value.map((santri) => santri.id));
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="gap-0 p-0 sm:max-w-3xl">
      <DialogHeader class="border-b px-5 py-4">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="max-h-[calc(92vh-72px)] overflow-y-auto"
        @submit.prevent="handleSubmit"
      >
        <div class="space-y-5 px-5 py-5">
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              class="rounded px-3 py-2 text-[13px] font-semibold transition-colors"
              :class="
                currentStep === 1
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              "
              @click="currentStep = 1"
            >
              1. Detail
            </button>
            <button
              type="button"
              class="rounded px-3 py-2 text-[13px] font-semibold transition-colors"
              :class="
                currentStep === 2
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              "
              @click="goToStudentStep"
            >
              2. Peserta
            </button>
          </div>

          <section v-if="currentStep === 1" class="space-y-3">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <Label>Nama Tabungan</Label>
                <Input
                  v-model="form.name"
                  type="text"
                  placeholder="Contoh: Tabungan Semester Ganjil"
                />
              </div>

              <div>
                <Label>Tahun Ajaran</Label>
                <select v-model="form.academicYearStart" class="ui-select">
                  <option
                    v-for="year in academicYearOptions"
                    :key="year.startYear"
                    :value="year.startYear"
                  >
                    {{ year.label }}
                  </option>
                </select>
              </div>

              <div>
                <Label>Semester</Label>
                <select v-model="form.semester" class="ui-select">
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                </select>
              </div>
            </div>
          </section>

          <section v-if="currentStep === 2" class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-bold text-foreground">
                Pilih {{ terms.studentSingularTitle }}
              </h3>
              <span class="text-xs font-semibold text-foreground">
                {{ selectedCount }}/{{ activeSantriList.length }} dipilih
              </span>
            </div>

            <Input
              v-model="searchQuery"
              type="search"
              :placeholder="`Cari nama, ${terms.levelSingularLower}, atau ${terms.mentorSingularLower}...`"
            />

            <div class="grid grid-cols-2 gap-2">
              <select v-model="selectedJilid" class="ui-select">
                <option value="semua">Semua {{ terms.levelSingularTitle }}</option>
                <option
                  v-for="jilid in jilidList"
                  :key="jilid.id"
                  :value="jilid.id"
                >
                  {{ jilid.nama }}
                </option>
              </select>
              <select v-model="selectedGuru" class="ui-select">
                <option value="semua">Semua {{ terms.mentorSingularTitle }}</option>
                <option
                  v-for="guru in guruList"
                  :key="guru.id"
                  :value="guru.id"
                >
                  {{ guru.nama }}
                </option>
              </select>
            </div>

            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-muted-foreground">
                {{ filteredSantriList.length }} hasil filter
              </p>
              <div class="flex items-center gap-3">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  class="h-auto px-0 text-foreground"
                  @click="selectAllSantri"
                >
                  Pilih Semua
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  class="h-auto px-0 text-muted-foreground"
                  @click="deselectAllSantri"
                >
                  Kosongkan Pilihan
                </Button>
              </div>
            </div>

            <div class="max-h-72 overflow-y-auto rounded-md border">
              <label
                v-for="santri in filteredSantriList"
                :key="santri.id"
                class="flex cursor-pointer items-start gap-3 border-b px-3 py-3 last:border-b-0 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  :checked="selectedSantriIds.has(santri.id)"
                  @change="toggleSantriSelection(santri.id)"
                />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-foreground">
                    {{ santri.nama }}
                  </span>
                  <span class="block text-xs text-muted-foreground">
                    {{ getJilidName(santri.jilidId) }} -
                    {{ getGuruName(santri.guruId) }}
                  </span>
                </span>
              </label>

              <div
                v-if="filteredSantriList.length === 0"
                class="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                Tidak ada {{ terms.studentSingularLower }} yang sesuai filter.
              </div>
            </div>
          </section>
        </div>

        <div
          class="sticky bottom-0 flex flex-col-reverse gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:justify-end"
        >
          <Button
            type="button"
            variant="outline"
            @click="currentStep === 1 ? handleOpenChange(false) : (currentStep = 1)"
          >
            {{ currentStep === 1 ? "Batal" : "Sebelumnya" }}
          </Button>
          <Button
            type="button"
            :disabled="saving"
            @click="handlePrimaryAction"
          >
            {{
              currentStep === 1
                ? "Selanjutnya"
                : saving
                  ? "Menyimpan..."
                  : submitText
            }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
