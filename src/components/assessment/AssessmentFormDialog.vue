<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { Plus, Trash2 } from "@lucide/vue";
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
  AssessmentFormData,
  AssessmentFormItem,
  Guru,
  Jilid,
  Santri,
} from "../../types";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description: string;
    submitText: string;
    saving?: boolean;
    initialValue?: AssessmentFormData | null;
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
  (event: "submit", value: AssessmentFormData): void;
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

const currentStep = ref<1 | 2 | 3>(1);
const form = ref<AssessmentFormData>({
  name: "",
  assessmentType: "score",
  minimumScore: 0,
  items: [],
  santriIds: [],
});

const getDefaultItems = (): AssessmentFormItem[] => [
  { label: "" },
];

const getDefaultValue = (): AssessmentFormData => ({
  name: "",
  assessmentType: "score",
  minimumScore: 0,
  items: getDefaultItems(),
  santriIds: activeSantriList.value.map((santri) => santri.id),
});

const maxScore = computed(() => (form.value.assessmentType === "scale" ? 5 : 100));

const resetForm = () => {
  form.value = props.initialValue
    ? {
        ...props.initialValue,
        items: props.initialValue.items.map((item) => ({ ...item })),
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

const addItem = () => {
  form.value.items.push({ label: "" });
};

const removeItem = (index: number) => {
  if (form.value.items.length === 1) {
    emit("validation-error", "Minimal ada 1 butir penilaian.");
    return;
  }

  form.value.items.splice(index, 1);
};

const validateDetail = () => {
  if (!form.value.name.trim()) {
    emit("validation-error", "Nama penilaian wajib diisi.");
    return false;
  }

  return true;
};

const validateItems = () => {
  if (
    Number.isNaN(Number(form.value.minimumScore)) ||
    form.value.minimumScore < 0 ||
    form.value.minimumScore > maxScore.value
  ) {
    emit(
      "validation-error",
      `Nilai minimum harus antara 0 dan ${maxScore.value}.`,
    );
    return false;
  }

  if (form.value.items.length === 0) {
    emit("validation-error", "Minimal ada 1 butir penilaian.");
    return false;
  }

  if (form.value.items.some((item) => !item.label.trim())) {
    emit("validation-error", "Semua nama butir penilaian wajib diisi.");
    return false;
  }

  return true;
};

const goToStep = (step: 1 | 2 | 3) => {
  if (step >= 2 && !validateDetail()) return;
  if (step === 3 && !validateItems()) return;
  currentStep.value = step;
};

const handleSubmit = () => {
  if (currentStep.value === 1) {
    goToStep(2);
    return;
  }

  if (currentStep.value === 2) {
    goToStep(3);
    return;
  }

  if (!validateDetail() || !validateItems()) return;

  if (selectedSantriIds.value.size === 0) {
    emit("validation-error", `Pilih minimal 1 ${terms.studentSingularLower}.`);
    return;
  }

  emit("submit", {
    name: form.value.name.trim(),
    assessmentType: form.value.assessmentType,
    minimumScore: Number(form.value.minimumScore),
    items: form.value.items.map((item) => ({
      id: item.id,
      label: item.label.trim(),
    })),
    santriIds: [...selectedSantriIds.value],
  });
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

watch(
  () => form.value.assessmentType,
  () => {
    if (form.value.minimumScore > maxScore.value) {
      form.value.minimumScore = maxScore.value;
    }
  },
);
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
          <div class="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
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
              @click="goToStep(2)"
            >
              2. Butiran
            </button>
            <button
              type="button"
              class="rounded px-3 py-2 text-[13px] font-semibold transition-colors"
              :class="
                currentStep === 3
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              "
              @click="goToStep(3)"
            >
              3. Peserta
            </button>
          </div>

          <section v-if="currentStep === 1" class="space-y-3">
            <div>
              <Label>Nama Penilaian</Label>
              <Input
                v-model="form.name"
                type="text"
                placeholder="Contoh: Evaluasi Hafalan Pekanan"
              />
            </div>

          </section>

          <section v-if="currentStep === 2" class="space-y-3">
            <div class="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:grid sm:grid-cols-2">
              <div>
                <Label class="text-xs">Tipe Penilaian</Label>
                <select v-model="form.assessmentType" class="ui-select">
                  <option value="score">Nilai 0-100</option>
                  <option value="scale">Skala 1-5</option>
                </select>
              </div>

              <div>
                <Label class="text-xs">Nilai Minimum</Label>
                <Input
                  v-model.number="form.minimumScore"
                  type="number"
                  min="0"
                  :max="maxScore"
                  step="1"
                  :placeholder="form.assessmentType === 'scale' ? 'Contoh: 3' : 'Contoh: 70'"
                />
              </div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-bold text-foreground">
                Butiran Penilaian
              </h3>
              <Button type="button" variant="outline" size="sm" @click="addItem">
                <Plus class="h-4 w-4" :stroke-width="1.8" />
                Tambah Butir
              </Button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-3"
              >
                <div>
                  <Label class="text-xs">Butir yang Dinilai</Label>
                  <Input
                    v-model="item.label"
                    type="text"
                    placeholder="Contoh: Kelancaran"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="removeItem(index)"
                >
                  <Trash2 class="h-4 w-4" :stroke-width="1.8" />
                </Button>
              </div>
            </div>
          </section>

          <section v-if="currentStep === 3" class="space-y-3">
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
                  Kosongkan
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
            @click="
              currentStep === 1
                ? handleOpenChange(false)
                : (currentStep = currentStep === 3 ? 2 : 1)
            "
          >
            {{ currentStep === 1 ? "Batal" : "Sebelumnya" }}
          </Button>
          <Button type="button" :disabled="saving" @click="handleSubmit">
            {{
              currentStep < 3
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
