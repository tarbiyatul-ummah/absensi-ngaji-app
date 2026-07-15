<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  addSavingsAccount,
  getSavingsAccounts,
} from "../services/savingsService";
import type { Guru, Jilid, Santri, SavingsAccount } from "../types";
import {
  type AcademicSemester,
  getAcademicYearLabel,
  getAcademicYearOptions,
  getCurrentAcademicYearStart,
  getCurrentSemester,
} from "../utils/academicPeriod";
import Toast from "../components/master/Toast.vue";
import { terms } from "../config/organization";

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const savingsAccounts = ref<SavingsAccount[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const isAddModalOpen = ref(false);
const currentStep = ref<1 | 2>(1);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const form = ref({
  name: "",
  academicYearStart: getCurrentAcademicYearStart(),
  semester: getCurrentSemester() as AcademicSemester,
  mode: "monthly" as const,
});
const searchQuery = ref("");
const selectedJilid = ref("semua");
const selectedGuru = ref("semua");
const selectedSantriIds = ref<Set<string>>(new Set());

const triggerToast = (
  message: string,
  type: "success" | "error" = "success",
) => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

const academicYearOptions = computed(() =>
  getAcademicYearOptions(getCurrentAcademicYearStart()),
);

const activeSantriList = computed(() =>
  santriList.value
    .filter((santri) => santri.isActive !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama)),
);

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

const filteredSantriList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return activeSantriList.value.filter((santri) => {
    const matchesJilid =
      selectedJilid.value === "semua" || santri.jilidId === selectedJilid.value;
    const matchesGuru =
      selectedGuru.value === "semua" || santri.guruId === selectedGuru.value;
    const searchableText = [
      santri.nama,
      getJilidName(santri.jilidId),
      getGuruName(santri.guruId),
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesJilid &&
      matchesGuru &&
      (!keyword || searchableText.includes(keyword))
    );
  });
});

const selectedCount = computed(() => selectedSantriIds.value.size);
const canGoToStudentStep = computed(() => form.value.name.trim().length > 0);

const totalConfiguredSantri = computed(() =>
  savingsAccounts.value.reduce(
    (total, account) => total + account.santriIds.length,
    0,
  ),
);

const semesterLabel = (semester: AcademicSemester) =>
  semester === "ganjil" ? "Ganjil" : "Genap";

const resetForm = () => {
  form.value = {
    name: "",
    academicYearStart: getCurrentAcademicYearStart(),
    semester: getCurrentSemester(),
    mode: "monthly",
  };
  searchQuery.value = "";
  selectedJilid.value = "semua";
  selectedGuru.value = "semua";
  currentStep.value = 1;
  selectedSantriIds.value = new Set(
    activeSantriList.value.map((santri) => santri.id),
  );
};

const openAddModal = () => {
  resetForm();
  isAddModalOpen.value = true;
};

const closeAddModal = () => {
  if (isSaving.value) return;
  isAddModalOpen.value = false;
};

const selectAllSantri = () => {
  selectedSantriIds.value = new Set(
    activeSantriList.value.map((santri) => santri.id),
  );
};

const deselectAllSantri = () => {
  selectedSantriIds.value = new Set();
};

const toggleSantriSelection = (santriId: string) => {
  const nextSelected = new Set(selectedSantriIds.value);
  if (nextSelected.has(santriId)) {
    nextSelected.delete(santriId);
  } else {
    nextSelected.add(santriId);
  }
  selectedSantriIds.value = nextSelected;
};

const loadData = async () => {
  isLoading.value = true;

  try {
    const [santriRes, jilidRes, guruRes] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
    ]);
    santriList.value = santriRes;
    jilidList.value = jilidRes;
    guruList.value = guruRes;
  } catch (error) {
    triggerToast("Koneksi bermasalah. Data peserta belum bisa dimuat.", "error");
  } finally {
    isLoading.value = false;
  }

  try {
    savingsAccounts.value = await getSavingsAccounts();
  } catch (error) {
    savingsAccounts.value = [];
    console.warn("Savings accounts could not be loaded.", error);
  }
};

const goToStudentStep = () => {
  if (!canGoToStudentStep.value) {
    triggerToast("Nama tabungan wajib diisi.", "error");
    return;
  }

  currentStep.value = 2;
};

const handleCreateSavings = async () => {
  const name = form.value.name.trim();

  if (!name) {
    triggerToast("Nama tabungan wajib diisi.", "error");
    return;
  }

  if (selectedSantriIds.value.size === 0) {
    triggerToast(`Pilih minimal 1 ${terms.studentSingularLower}.`, "error");
    return;
  }

  isSaving.value = true;
  try {
    await addSavingsAccount({
      name,
      academicYearStart: form.value.academicYearStart,
      semester: form.value.semester,
      mode: form.value.mode,
      santriIds: [...selectedSantriIds.value],
    });
    await loadData();
    isAddModalOpen.value = false;
    triggerToast("Tabungan berhasil dibuat.");
  } catch (error) {
    triggerToast("Tabungan gagal disimpan.", "error");
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="app-page">
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <div class="app-container-wide space-y-5">
      <Button as-child variant="ghost" size="sm" class="w-fit px-2">
        <RouterLink to="/dashboard">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="16"
            color="currentColor"
            :stroke-width="1.7"
          />
          Dashboard
        </RouterLink>
      </Button>

      <header class="app-header">
        <div>
          <h1 class="app-title">Tabungan</h1>
          <p class="app-subtitle">
            Setup tabungan per semester dengan mode bulanan.
          </p>
        </div>
        <Button
          type="button"
          @click="openAddModal"
        >
          <HugeiconsIcon
            :icon="PlusSignIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Tambah Tabungan
        </Button>
      </header>

      <div v-if="isLoading" class="flex h-64 items-center justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary)]"
        ></div>
      </div>

      <main v-else class="space-y-5">
        <Card class="grid grid-cols-2">
          <div class="border-r p-4">
            <p class="text-xs text-muted-foreground">Total Tabungan</p>
            <p class="text-2xl font-bold text-foreground">
              {{ savingsAccounts.length }}
            </p>
          </div>
          <div class="p-4">
            <p class="text-xs text-muted-foreground">Total Terdaftar</p>
            <p class="text-2xl font-bold text-foreground">
              {{ totalConfiguredSantri }}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Daftar Tabungan
            </CardTitle>
            <CardDescription>
              Konfigurasi tabungan yang sudah dibuat
            </CardDescription>
          </CardHeader>

          <div v-if="savingsAccounts.length > 0" class="divide-y divide-[#F1F2F3]">
            <article
              v-for="account in savingsAccounts"
              :key="account.id"
              class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                >
                  <HugeiconsIcon
                    :icon="AddMoneyCircleIcon"
                    :size="22"
                    color="currentColor"
                    :stroke-width="1.7"
                  />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-foreground">
                    {{ account.name }}
                  </h3>
                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{ getAcademicYearLabel(account.academicYearStart) }} -
                    Semester {{ semesterLabel(account.semester) }} - Bulanan
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {{ account.santriIds.length }} {{ terms.studentSingularLower }}
              </Badge>
            </article>
          </div>

          <div v-else class="px-4 py-10 text-center">
            <p class="text-sm font-medium text-foreground">
              Belum ada tabungan.
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              Klik Tambah Tabungan untuk membuat setup pertama.
            </p>
          </div>
        </Card>
      </main>
    </div>

    <Dialog :open="isAddModalOpen" @update:open="(open) => !open && closeAddModal()">
      <DialogContent class="gap-0 p-0 sm:max-w-3xl">
        <DialogHeader class="border-b px-5 py-4">
          <DialogTitle>Tambah Tabungan</DialogTitle>
          <DialogDescription>
            Isi nama, semester, lalu pilih {{ terms.studentSingularLower }}.
          </DialogDescription>
        </DialogHeader>

        <form
          class="max-h-[calc(92vh-72px)] overflow-y-auto"
          @submit.prevent="handleCreateSavings"
        >
          <div class="space-y-5 px-5 py-5">
            <div class="grid grid-cols-2 gap-2 rounded-lg bg-[var(--muted)] p-1">
              <button
                type="button"
                class="rounded px-3 py-2 text-[13px] font-semibold transition-colors"
                :class="
                  currentStep === 1
                    ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)]'
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
                    ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)]'
                "
                @click="goToStudentStep"
              >
                2. Peserta
              </button>
            </div>

            <section class="space-y-3">
              <template v-if="currentStep === 1">
              <div class="flex items-center gap-2">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]"
                >
                  1
                </span>
                <h3 class="text-sm font-bold text-[var(--foreground)]">
                  Nama dan periode
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <Label>
                    Nama Tabungan
                  </Label>
                  <Input
                    v-model="form.name"
                    type="text"
                    placeholder="Contoh: Tabungan Semester Ganjil"
                  />
                </div>

                <div>
                  <Label>
                    Tahun Ajaran
                  </Label>
                  <select
                    v-model="form.academicYearStart"
                    class="ui-select"
                  >
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
                  <Label>
                    Semester
                  </Label>
                  <select
                    v-model="form.semester"
                    class="ui-select"
                  >
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>
              </div>
              </template>
            </section>

            <section v-if="currentStep === 2" class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]"
                  >
                    2
                  </span>
                  <h3 class="text-sm font-bold text-[var(--foreground)]">
                    Pilih {{ terms.studentSingularTitle }}
                  </h3>
                </div>
                <span class="text-xs font-semibold text-[var(--foreground)]">
                  {{ selectedCount }}/{{ activeSantriList.length }} dipilih
                </span>
              </div>

              <Input
                v-model="searchQuery"
                type="search"
                :placeholder="`Cari nama, ${terms.levelSingularLower}, atau ${terms.mentorSingularLower}...`"
              />

              <div class="grid grid-cols-2 gap-2">
                <select
                  v-model="selectedJilid"
                  class="ui-select"
                >
                  <option value="semua">Semua {{ terms.levelSingularTitle }}</option>
                  <option
                    v-for="jilid in jilidList"
                    :key="jilid.id"
                    :value="jilid.id"
                  >
                    {{ jilid.nama }}
                  </option>
                </select>
                <select
                  v-model="selectedGuru"
                  class="ui-select"
                >
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
                <p class="text-xs text-[var(--muted-foreground)]">
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

              <div
                class="max-h-72 overflow-y-auto rounded-md border"
              >
                <label
                  v-for="santri in filteredSantriList"
                  :key="santri.id"
                  class="flex cursor-pointer items-start gap-3 border-b px-3 py-3 last:border-b-0 hover:bg-[var(--accent)]"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    :checked="selectedSantriIds.has(santri.id)"
                    @change="toggleSantriSelection(santri.id)"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-[var(--foreground)]">
                      {{ santri.nama }}
                    </span>
                    <span class="block text-xs text-[var(--muted-foreground)]">
                      {{ getJilidName(santri.jilidId) }} -
                      {{ getGuruName(santri.guruId) }}
                    </span>
                  </span>
                </label>

                <div
                  v-if="filteredSantriList.length === 0"
                  class="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  Tidak ada {{ terms.studentSingularLower }} yang sesuai filter.
                </div>
              </div>
            </section>
          </div>

          <div
            class="sticky bottom-0 flex flex-col-reverse gap-2 border-t bg-[var(--background)] px-5 py-4 sm:flex-row sm:justify-end"
          >
            <Button
              type="button"
              variant="outline"
              @click="currentStep === 1 ? closeAddModal() : (currentStep = 1)"
            >
              {{ currentStep === 1 ? "Batal" : "Sebelumnya" }}
            </Button>
            <Button
              :type="currentStep === 1 ? 'button' : 'submit'"
              :disabled="isSaving"
              @click="currentStep === 1 ? goToStudentStep() : undefined"
            >
              {{
                currentStep === 1
                  ? "Selanjutnya"
                  : isSaving
                    ? "Menyimpan..."
                    : "Selesai"
              }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
