<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import SavingsAccountFormDialog from "../components/savings/SavingsAccountFormDialog.vue";
import Toast from "../components/master/Toast.vue";
import { terms } from "../config/organization";
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
} from "../utils/academicPeriod";

const route = useRoute();
const router = useRouter();
const accountId = computed(() => String(route.params.id ?? ""));

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const account = ref<SavingsAccount | null>(null);
const paymentList = ref<SavingsPayment[]>([]);
const isLoading = ref(true);
const isPaymentLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const savingPaymentIds = ref<Set<string>>(new Set());
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

const triggerToast = (
  message: string,
  type: "success" | "error" = "success",
) => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

const activeSantriList = computed(() =>
  santriList.value
    .filter((santri) => santri.isActive !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama)),
);

const selectedSavingsMonthOptions = computed(() => {
  if (!account.value) return [];

  const monthOptions = getAcademicMonthOptions(account.value.academicYearStart);
  return account.value.semester === "ganjil"
    ? monthOptions.slice(0, 6)
    : monthOptions.slice(6);
});

const paymentByKey = computed(() => {
  return paymentList.value.reduce(
    (acc, payment) => {
      acc[`${payment.santriId}_${payment.month}`] = payment;
      return acc;
    },
    {} as Record<string, SavingsPayment>,
  );
});

const selectedSavingsSantriList = computed(() => {
  if (!account.value) return [];

  const selectedIds = new Set(account.value.santriIds);
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

const editInitialValue = computed<SavingsAccountFormData | null>(() => {
  if (!account.value) return null;

  return {
    name: account.value.name,
    academicYearStart: account.value.academicYearStart,
    semester: account.value.semester,
    mode: account.value.mode,
    santriIds: account.value.santriIds,
  };
});

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

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

const loadPayments = async () => {
  if (!accountId.value) return;

  isPaymentLoading.value = true;
  try {
    paymentList.value = await getSavingsPaymentsByAccount(accountId.value);
  } catch (error) {
    triggerToast("Data pembayaran tabungan belum bisa dimuat.", "error");
  } finally {
    isPaymentLoading.value = false;
  }
};

const loadData = async () => {
  isLoading.value = true;

  try {
    const [santriRes, jilidRes, guruRes, accountRes] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
      getSavingsAccountById(accountId.value),
    ]);
    santriList.value = santriRes;
    jilidList.value = jilidRes;
    guruList.value = guruRes;
    account.value = accountRes;

    if (!accountRes) {
      triggerToast("Tabungan tidak ditemukan.", "error");
      return;
    }

    await loadPayments();
  } catch (error) {
    triggerToast("Koneksi bermasalah. Detail tabungan belum bisa dimuat.", "error");
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = () => {
  if (!account.value) return;

  isEditModalOpen.value = true;
};

const handleUpdateSavings = async (data: SavingsAccountFormData) => {
  if (!account.value) return;

  isSaving.value = true;
  try {
    await updateSavingsAccount(account.value.id, data);
    account.value = await getSavingsAccountById(account.value.id);
    isEditModalOpen.value = false;
    triggerToast("Tabungan berhasil diperbarui.");
  } catch (error) {
    triggerToast("Tabungan gagal diperbarui.", "error");
  } finally {
    isSaving.value = false;
  }
};

const toggleSavingsPayment = async (santri: Santri, month: string) => {
  if (!account.value) return;

  const id = getSavingsPaymentId(account.value.id, month, santri.id);
  const previousPayments = paymentList.value.map((payment) => ({
    ...payment,
  }));
  const nextIsPaid = !isSavingsPaid(santri.id, month);
  const nextPayment: SavingsPayment = {
    id,
    savingsAccountId: account.value.id,
    santriId: santri.id,
    academicYearStart: account.value.academicYearStart,
    semester: account.value.semester,
    month,
    isPaid: nextIsPaid,
    paidAt: nextIsPaid ? Date.now() : null,
    updatedAt: Date.now(),
  };
  const existingIndex = paymentList.value.findIndex(
    (payment) => payment.id === id,
  );

  if (existingIndex >= 0) {
    paymentList.value[existingIndex] = nextPayment;
  } else {
    paymentList.value.push(nextPayment);
  }

  savingPaymentIds.value.add(id);

  try {
    await saveSavingsPayment({
      savingsAccountId: account.value.id,
      santriId: santri.id,
      academicYearStart: account.value.academicYearStart,
      semester: account.value.semester,
      month,
      isPaid: nextIsPaid,
      paidAt: nextPayment.paidAt,
    });
  } catch (error) {
    paymentList.value = previousPayments;
    triggerToast("Pembayaran tabungan gagal disimpan.", "error");
  } finally {
    savingPaymentIds.value.delete(id);
  }
};

const handleDeleteSavings = async () => {
  if (!account.value) return;

  isDeleting.value = true;
  try {
    await deleteSavingsAccount(account.value.id);
    isDeleteModalOpen.value = false;
    await router.push("/tabungan");
  } catch (error) {
    triggerToast("Tabungan gagal dihapus.", "error");
  } finally {
    isDeleting.value = false;
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
        <RouterLink to="/tabungan">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="16"
            color="currentColor"
            :stroke-width="1.7"
          />
          Tabungan
        </RouterLink>
      </Button>

      <div v-if="isLoading" class="flex h-64 items-center justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
        ></div>
      </div>

      <main v-else-if="account" class="space-y-5">
        <header class="app-header">
          <div>
            <h1 class="app-title">{{ account.name }}</h1>
            <p class="app-subtitle">
              {{ getAcademicYearLabel(account.academicYearStart) }} -
              Semester {{ semesterLabel(account.semester) }}
            </p>
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" @click="openEditModal">
              Edit Tabungan
            </Button>
            <Button
              type="button"
              variant="destructive"
              @click="isDeleteModalOpen = true"
            >
              Hapus
            </Button>
          </div>
        </header>

        <Card class="grid grid-cols-2 md:grid-cols-4">
          <div class="border-r p-4">
            <p class="text-xs text-muted-foreground">Terdaftar</p>
            <p class="text-2xl font-bold text-foreground">
              {{ selectedSavingsSantriList.length }}
            </p>
          </div>
          <div class="border-r-0 p-4 md:border-r">
            <p class="text-xs text-muted-foreground">Lunas</p>
            <p class="text-2xl font-bold text-[hsl(142_72%_29%)]">
              {{ totalSavingsPaid }}
            </p>
          </div>
          <div class="border-r border-t p-4 md:border-t-0">
            <p class="text-xs text-muted-foreground">Belum Lunas</p>
            <p class="text-2xl font-bold text-destructive">
              {{ totalSavingsUnpaid }}
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
            <CardTitle>Tracking Pembayaran</CardTitle>
            <CardDescription>
              Checklist pembayaran tabungan bulanan untuk semester ini.
            </CardDescription>
          </CardHeader>

          <div
            v-if="isPaymentLoading"
            class="border-t px-4 py-3 text-[13px] text-muted-foreground"
          >
            Memuat pembayaran tabungan...
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
                      getSavingsPaymentId(account.id, month.value, santri.id),
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
                          getSavingsPaymentId(account.id, month.value, santri.id),
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

      <Card v-else>
        <div class="px-4 py-10 text-center">
          <p class="text-sm font-medium text-foreground">Tabungan tidak ditemukan.</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Kembali ke daftar tabungan untuk memilih data lain.
          </p>
        </div>
      </Card>
    </div>

    <SavingsAccountFormDialog
      v-model:open="isEditModalOpen"
      title="Edit Tabungan"
      description="Perbarui detail dan peserta yang ikut tabungan ini."
      submit-text="Simpan Perubahan"
      :saving="isSaving"
      :initial-value="editInitialValue"
      :santri-list="santriList"
      :jilid-list="jilidList"
      :guru-list="guruList"
      @submit="handleUpdateSavings"
      @validation-error="(message) => triggerToast(message, 'error')"
    />

    <ConfirmModal
      :is-open="isDeleteModalOpen"
      title="Hapus Tabungan?"
      :message="`Tabungan ${account?.name ?? ''} dan seluruh checklist pembayarannya akan dihapus.`"
      :confirm-text="isDeleting ? 'Menghapus...' : 'Hapus Tabungan'"
      @confirm="handleDeleteSavings"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>
