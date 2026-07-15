<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
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
import SavingsAccountFormDialog from "../components/savings/SavingsAccountFormDialog.vue";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  addSavingsAccount,
  getSavingsAccounts,
} from "../services/savingsService";
import type {
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
import Toast from "../components/master/Toast.vue";
import { terms } from "../config/organization";

const router = useRouter();

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const savingsAccounts = ref<SavingsAccount[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const isAddModalOpen = ref(false);
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

const totalConfiguredSantri = computed(() =>
  savingsAccounts.value.reduce(
    (total, account) => total + account.santriIds.length,
    0,
  ),
);

const semesterLabel = (semester: AcademicSemester) =>
  semester === "ganjil" ? "Ganjil" : "Genap";

const openAddModal = () => {
  isAddModalOpen.value = true;
};

const loadData = async () => {
  isLoading.value = true;

  try {
    const [santriRes, jilidRes, guruRes, savingsRes] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
      getSavingsAccounts(),
    ]);
    santriList.value = santriRes;
    jilidList.value = jilidRes;
    guruList.value = guruRes;
    savingsAccounts.value = savingsRes;
  } catch (error) {
    triggerToast("Koneksi bermasalah. Data tabungan belum bisa dimuat.", "error");
  } finally {
    isLoading.value = false;
  }
};

const handleCreateSavings = async (data: SavingsAccountFormData) => {
  isSaving.value = true;
  try {
    const accountId = await addSavingsAccount(data);
    isAddModalOpen.value = false;
    await router.push(`/tabungan/${accountId}`);
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
            Buat tabungan per semester, lalu buka detail untuk tracking pembayaran.
          </p>
        </div>
        <Button type="button" @click="openAddModal">
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
            <CardTitle>Daftar Tabungan</CardTitle>
            <CardDescription>
              Klik tabungan untuk membuka tracking pembayaran.
            </CardDescription>
          </CardHeader>

          <div v-if="savingsAccounts.length > 0" class="divide-y divide-[#F1F2F3]">
            <RouterLink
              v-for="account in savingsAccounts"
              :key="account.id"
              :to="`/tabungan/${account.id}`"
              class="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
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
              <Badge variant="secondary">
                {{ account.santriIds.length }} {{ terms.studentSingularLower }}
              </Badge>
            </RouterLink>
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

    <SavingsAccountFormDialog
      v-model:open="isAddModalOpen"
      title="Tambah Tabungan"
      :description="`Isi nama, semester, lalu pilih ${terms.studentSingularLower}.`"
      submit-text="Selesai"
      :saving="isSaving"
      :santri-list="santriList"
      :jilid-list="jilidList"
      :guru-list="guruList"
      @submit="handleCreateSavings"
      @validation-error="(message) => triggerToast(message, 'error')"
    />
  </div>
</template>
