<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
  getSavingsPaymentId,
  getSavingsAccounts,
  getSavingsPaymentsByAccount,
  saveSavingsPayment,
} from "../services/savingsService";
import type { Guru, Jilid, Santri, SavingsAccount, SavingsPayment } from "../types";
import {
  type AcademicSemester,
  getAcademicMonthOptions,
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
const savingsPaymentList = ref<SavingsPayment[]>([]);
const selectedSavingsAccountId = ref<string | null>(null);
const isLoading = ref(true);
const isPaymentLoading = ref(false);
const isSaving = ref(false);
const savingPaymentIds = ref<Set<string>>(new Set());
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

const selectedSavingsAccount = computed(() => {
  if (!selectedSavingsAccountId.value) return savingsAccounts.value[0] ?? null;

  return (
    savingsAccounts.value.find(
      (account) => account.id === selectedSavingsAccountId.value,
    ) ?? null
  );
});

const selectedSavingsMonthOptions = computed(() => {
  if (!selectedSavingsAccount.value) return [];

  const monthOptions = getAcademicMonthOptions(
    selectedSavingsAccount.value.academicYearStart,
  );
  return selectedSavingsAccount.value.semester === "ganjil"
    ? monthOptions.slice(0, 6)
    : monthOptions.slice(6);
});

const paymentByKey = computed(() => {
  return savingsPaymentList.value.reduce(
    (acc, payment) => {
      acc[`${payment.santriId}_${payment.month}`] = payment;
      return acc;
    },
    {} as Record<string, SavingsPayment>,
  );
});

const selectedSavingsSantriList = computed(() => {
  if (!selectedSavingsAccount.value) return [];

  const selectedIds = new Set(selectedSavingsAccount.value.santriIds);
  return activeSantriList.value.filter((santri) => selectedIds.has(santri.id));
});

const totalSavingsBills = computed(
  () =>
    selectedSavingsSantriList.value.length *
    selectedSavingsMonthOptions.value.length,
);

const totalSavingsPaid = computed(() => {
  return selectedSavingsSantriList.value.reduce((total, santri) => {
    return (
      total +
      selectedSavingsMonthOptions.value.filter((month) =>
        isSavingsPaid(santri.id, month.value),
      ).length
    );
  }, 0);
});

const totalSavingsUnpaid = computed(
  () => totalSavingsBills.value - totalSavingsPaid.value,
);

const savingsCompletionPercent = computed(() =>
  totalSavingsBills.value > 0
    ? Math.round((totalSavingsPaid.value / totalSavingsBills.value) * 100)
    : 0,
);

const semesterLabel = (semester: AcademicSemester) =>
  semester === "ganjil" ? "Ganjil" : "Genap";

const getSavingsPayment = (santriId: string, month: string) =>
  paymentByKey.value[`${santriId}_${month}`];

const isSavingsPaid = (santriId: string, month: string) =>
  getSavingsPayment(santriId, month)?.isPaid === true;

const getSavingsPaidCount = (santriId: string) =>
  selectedSavingsMonthOptions.value.filter((month) =>
    isSavingsPaid(santriId, month.value),
  ).length;

const formatMonthShort = (monthLabel: string) =>
  monthLabel.split(" ")[0].slice(0, 3);

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

const loadSavingsPayments = async (accountId: string | null) => {
  if (!accountId) {
    savingsPaymentList.value = [];
    return;
  }

  isPaymentLoading.value = true;

  try {
    savingsPaymentList.value = await getSavingsPaymentsByAccount(accountId);
  } catch (error) {
    savingsPaymentList.value = [];
    triggerToast("Data pembayaran tabungan belum bisa dimuat.", "error");
  } finally {
    isPaymentLoading.value = false;
  }
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
    if (
      savingsAccounts.value.length > 0 &&
      !savingsAccounts.value.some(
        (account) => account.id === selectedSavingsAccountId.value,
      )
    ) {
      selectedSavingsAccountId.value = savingsAccounts.value[0].id;
    }
  } catch (error) {
    savingsAccounts.value = [];
    selectedSavingsAccountId.value = null;
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

const handleSavingsFormSubmit = () => {
  if (currentStep.value === 1) {
    goToStudentStep();
    return;
  }

  void handleCreateSavings();
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
    const accountId = await addSavingsAccount({
      name,
      academicYearStart: form.value.academicYearStart,
      semester: form.value.semester,
      mode: form.value.mode,
      santriIds: [...selectedSantriIds.value],
    });
    selectedSavingsAccountId.value = accountId;
    await loadData();
    isAddModalOpen.value = false;
    triggerToast("Tabungan berhasil dibuat.");
  } catch (error) {
    triggerToast("Tabungan gagal disimpan.", "error");
  } finally {
    isSaving.value = false;
  }
};

const toggleSavingsPayment = async (santri: Santri, month: string) => {
  if (!selectedSavingsAccount.value) return;

  const account = selectedSavingsAccount.value;
  const id = getSavingsPaymentId(account.id, month, santri.id);
  const previousPayments = savingsPaymentList.value.map((payment) => ({
    ...payment,
  }));
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
  const existingIndex = savingsPaymentList.value.findIndex(
    (payment) => payment.id === id,
  );

  if (existingIndex >= 0) {
    savingsPaymentList.value[existingIndex] = nextPayment;
  } else {
    savingsPaymentList.value.push(nextPayment);
  }

  savingPaymentIds.value.add(id);

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
    savingsPaymentList.value = previousPayments;
    triggerToast("Pembayaran tabungan gagal disimpan.", "error");
  } finally {
    savingPaymentIds.value.delete(id);
  }
};

watch(selectedSavingsAccountId, (accountId) => {
  void loadSavingsPayments(accountId);
});

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
            Setup tabungan per semester dan pantau pembayarannya.
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
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
        ></div>
      </div>

      <main v-else class="space-y-5">
        <Card class="grid grid-cols-2 md:grid-cols-4">
          <div class="border-r p-4">
            <p class="text-xs text-muted-foreground">Total Tabungan</p>
            <p class="text-2xl font-bold text-foreground">
              {{ savingsAccounts.length }}
            </p>
          </div>
          <div class="border-r-0 p-4 md:border-r">
            <p class="text-xs text-muted-foreground">Total Terdaftar</p>
            <p class="text-2xl font-bold text-foreground">
              {{ totalConfiguredSantri }}
            </p>
          </div>
          <div class="border-r border-t p-4 md:border-t-0">
            <p class="text-xs text-muted-foreground">Lunas</p>
            <p class="text-2xl font-bold text-[hsl(142_72%_29%)]">
              {{ totalSavingsPaid }}
            </p>
          </div>
          <div class="border-t p-4 md:border-t-0">
            <p class="text-xs text-muted-foreground">Progress</p>
            <p class="text-2xl font-bold text-foreground">
              {{ savingsCompletionPercent }}%
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
            <button
              v-for="account in savingsAccounts"
              :key="account.id"
              type="button"
              class="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between"
              :class="
                selectedSavingsAccountId === account.id
                  ? 'bg-accent'
                  : 'hover:bg-accent'
              "
              @click="selectedSavingsAccountId = account.id"
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
                    Semester {{ semesterLabel(account.semester) }}
                  </p>
                </div>
              </div>
              <Badge
                :variant="
                  selectedSavingsAccountId === account.id
                    ? 'default'
                    : 'secondary'
                "
              >
                {{ account.santriIds.length }} {{ terms.studentSingularLower }}
              </Badge>
            </button>
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

        <Card v-if="selectedSavingsAccount">
          <CardHeader>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>
                  Tracking {{ selectedSavingsAccount.name }}
                </CardTitle>
                <CardDescription>
                  {{ getAcademicYearLabel(selectedSavingsAccount.academicYearStart) }}
                  - Semester {{ semesterLabel(selectedSavingsAccount.semester) }}
                </CardDescription>
              </div>
              <Badge variant="secondary" class="w-fit">
                {{ totalSavingsUnpaid }} belum lunas
              </Badge>
            </div>
          </CardHeader>

          <div
            v-if="isPaymentLoading"
            class="border-t px-4 py-3 text-[13px] text-muted-foreground"
          >
            Memuat pembayaran tabungan...
          </div>

          <div class="grid grid-cols-3 border-t">
            <div class="border-r p-4">
              <p class="text-xs text-muted-foreground">Terdaftar</p>
              <p class="text-xl font-bold text-foreground">
                {{ selectedSavingsSantriList.length }}
              </p>
            </div>
            <div class="border-r p-4">
              <p class="text-xs text-muted-foreground">Lunas</p>
              <p class="text-xl font-bold text-[hsl(142_72%_29%)]">
                {{ totalSavingsPaid }}
              </p>
            </div>
            <div class="p-4">
              <p class="text-xs text-muted-foreground">Total Tagihan</p>
              <p class="text-xl font-bold text-foreground">
                {{ totalSavingsBills }}
              </p>
            </div>
          </div>

          <div class="space-y-3 border-t p-4 md:hidden">
            <article
              v-for="santri in selectedSavingsSantriList"
              :key="santri.id"
              class="rounded-lg border bg-background p-3"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-sm font-semibold text-foreground">
                    {{ santri.nama }}
                  </h2>
                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{ getJilidName(santri.jilidId) }} -
                    {{ getGuruName(santri.guruId) }}
                  </p>
                </div>
                <Badge variant="secondary" class="shrink-0">
                  {{ getSavingsPaidCount(santri.id) }}/{{ selectedSavingsMonthOptions.length }}
                </Badge>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="month in selectedSavingsMonthOptions"
                  :key="`${santri.id}-${month.value}`"
                  type="button"
                  @click="toggleSavingsPayment(santri, month.value)"
                  :disabled="
                    savingPaymentIds.has(
                      getSavingsPaymentId(
                        selectedSavingsAccount.id,
                        month.value,
                        santri.id,
                      ),
                    )
                  "
                  class="flex h-12 flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
                  :class="
                    isSavingsPaid(santri.id, month.value)
                      ? 'border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)]'
                      : 'border-border bg-background text-muted-foreground active:bg-accent'
                  "
                >
                  <span>{{ formatMonthShort(month.label) }}</span>
                  <span class="mt-0.5 text-[10px]">
                    {{ isSavingsPaid(santri.id, month.value) ? "Lunas" : "Belum" }}
                  </span>
                </button>
              </div>
            </article>

            <div
              v-if="selectedSavingsSantriList.length === 0"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              Belum ada {{ terms.studentSingularLower }} di tabungan ini.
            </div>
          </div>

          <div class="hidden overflow-x-auto border-t md:block">
            <table class="min-w-[760px] w-full border-collapse text-left text-[13px]">
              <thead class="bg-muted text-muted-foreground">
                <tr>
                  <th
                    class="sticky left-0 z-10 w-56 bg-muted px-4 py-3 font-semibold"
                  >
                    {{ terms.studentSingularTitle }}
                  </th>
                  <th
                    v-for="month in selectedSavingsMonthOptions"
                    :key="month.value"
                    class="w-20 px-2 py-3 text-center font-semibold"
                  >
                    {{ formatMonthShort(month.label) }}
                  </th>
                  <th class="w-24 px-3 py-3 text-right font-semibold">Lunas</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="santri in selectedSavingsSantriList"
                  :key="santri.id"
                  class="hover:bg-accent"
                >
                  <td class="sticky left-0 z-10 bg-background px-4 py-3">
                    <p class="font-medium text-foreground">{{ santri.nama }}</p>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      {{ getJilidName(santri.jilidId) }} -
                      {{ getGuruName(santri.guruId) }}
                    </p>
                  </td>
                  <td
                    v-for="month in selectedSavingsMonthOptions"
                    :key="`${santri.id}-${month.value}`"
                    class="px-2 py-2 text-center"
                  >
                    <button
                      type="button"
                      @click="toggleSavingsPayment(santri, month.value)"
                      :disabled="
                        savingPaymentIds.has(
                          getSavingsPaymentId(
                            selectedSavingsAccount.id,
                            month.value,
                            santri.id,
                          ),
                        )
                      "
                      class="mx-auto flex h-8 w-8 items-center justify-center rounded-md border text-[12px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60"
                      :class="
                        isSavingsPaid(santri.id, month.value)
                          ? 'border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)]'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent'
                      "
                      :aria-label="`${santri.nama} ${month.label}`"
                    >
                      {{ isSavingsPaid(santri.id, month.value) ? "L" : "-" }}
                    </button>
                  </td>
                  <td class="px-3 py-3 text-right font-semibold text-foreground">
                    {{ getSavingsPaidCount(santri.id) }}/{{ selectedSavingsMonthOptions.length }}
                  </td>
                </tr>
                <tr v-if="selectedSavingsSantriList.length === 0">
                  <td
                    :colspan="selectedSavingsMonthOptions.length + 2"
                    class="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Belum ada {{ terms.studentSingularLower }} di tabungan ini.
                  </td>
                </tr>
              </tbody>
            </table>
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
          @submit.prevent="handleSavingsFormSubmit"
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

            <section class="space-y-3">
              <template v-if="currentStep === 1">
              <div class="flex items-center gap-2">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                >
                  1
                </span>
                <h3 class="text-sm font-bold text-foreground">
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
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    2
                  </span>
                  <h3 class="text-sm font-bold text-foreground">
                    Pilih {{ terms.studentSingularTitle }}
                  </h3>
                </div>
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

              <div
                class="max-h-72 overflow-y-auto rounded-md border"
              >
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
