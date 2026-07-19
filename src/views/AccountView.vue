<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { Check, Pencil, Plus, Trash2 } from "@lucide/vue";
import { HugeiconsIcon } from "@hugeicons/vue";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import Toast from "../components/master/Toast.vue";
import {
  dashboardMenuItems,
  organizationConfig,
  terms,
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

const router = useRouter();
const route = useRoute();
const activeFeatureItems = dashboardMenuItems.filter((item) => item.enabled);
const currentUserEmail = ref("");
const academicYears = ref<AcademicYear[]>([]);
const academicYearStartInput = ref(getCurrentAcademicYearStart());
const isAddAcademicYearOpen = ref(false);
const isAccountOnboardingOpen = ref(false);
const editingAcademicYear = ref<AcademicYear | null>(null);
const editAcademicYearStartInput = ref(getCurrentAcademicYearStart());
const deletingAcademicYear = ref<AcademicYear | null>(null);
const isAcademicYearLoading = ref(false);
const isAcademicYearSaving = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const accountEmail = computed(
  () => currentUserEmail.value || `Admin ${organizationConfig.typeLabel}`,
);

const sortedAcademicYears = computed(() =>
  academicYears.value.slice().sort((a, b) => b.startYear - a.startYear),
);

const triggerToast = (
  message: string,
  type: "success" | "error" = "success",
) => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

const loadAcademicYears = async () => {
  isAcademicYearLoading.value = true;
  try {
    academicYears.value = await getAcademicYears();
  } catch (error) {
    triggerToast(
      "Tahun ajaran belum bisa dimuat. Jalankan supabase/academic_year_schema.sql atau schema.sql terbaru di Supabase.",
      "error",
    );
  } finally {
    isAcademicYearLoading.value = false;
  }
};

const resetAcademicYearForm = () => {
  academicYearStartInput.value = getCurrentAcademicYearStart();
};

const openAddAcademicYearModal = () => {
  resetAcademicYearForm();
  isAddAcademicYearOpen.value = true;
};

const handleAddAcademicYearOpenChange = (open: boolean) => {
  if (!open && !isAcademicYearSaving.value) {
    isAddAcademicYearOpen.value = false;
  }
};

const handleSubmitAcademicYear = async () => {
  const startYear = Number(academicYearStartInput.value);

  if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
    triggerToast("Tahun awal harus berupa angka 2000 sampai 2100.", "error");
    return;
  }

  isAcademicYearSaving.value = true;
  try {
    await createAcademicYear(startYear);
    isAddAcademicYearOpen.value = false;
    triggerToast("Tahun ajaran berhasil ditambahkan.");
    resetAcademicYearForm();
    await loadAcademicYears();
  } catch (error) {
    triggerToast("Tahun ajaran gagal disimpan.", "error");
  } finally {
    isAcademicYearSaving.value = false;
  }
};

const startEditAcademicYear = (academicYear: AcademicYear) => {
  editingAcademicYear.value = academicYear;
  editAcademicYearStartInput.value = academicYear.startYear;
};

const handleEditAcademicYearOpenChange = (open: boolean) => {
  if (!open && !isAcademicYearSaving.value) {
    editingAcademicYear.value = null;
  }
};

const handleUpdateAcademicYear = async () => {
  if (!editingAcademicYear.value) return;

  const startYear = Number(editAcademicYearStartInput.value);

  if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
    triggerToast("Tahun awal harus berupa angka 2000 sampai 2100.", "error");
    return;
  }

  isAcademicYearSaving.value = true;
  try {
    await updateAcademicYear(editingAcademicYear.value.id, startYear);
    editingAcademicYear.value = null;
    await loadAcademicYears();
    triggerToast("Tahun ajaran berhasil diperbarui.");
  } catch (error) {
    triggerToast("Tahun ajaran gagal diperbarui.", "error");
  } finally {
    isAcademicYearSaving.value = false;
  }
};

const handleSetActiveAcademicYear = async (academicYear: AcademicYear) => {
  isAcademicYearSaving.value = true;
  try {
    await setActiveAcademicYear(academicYear.id);
    await loadAcademicYears();
    triggerToast("Tahun ajaran aktif berhasil diganti.");
  } catch (error) {
    triggerToast("Tahun ajaran aktif gagal diganti.", "error");
  } finally {
    isAcademicYearSaving.value = false;
  }
};

const handleDeleteAcademicYear = async () => {
  if (!deletingAcademicYear.value) return;

  isAcademicYearSaving.value = true;
  try {
    await removeAcademicYear(deletingAcademicYear.value.id);
    if (editingAcademicYear.value?.id === deletingAcademicYear.value.id) {
      editingAcademicYear.value = null;
    }
    deletingAcademicYear.value = null;
    resetAcademicYearForm();
    await loadAcademicYears();
    triggerToast("Tahun ajaran berhasil dihapus.");
  } catch (error) {
    triggerToast("Tahun ajaran gagal dihapus.", "error");
  } finally {
    isAcademicYearSaving.value = false;
  }
};

const closeAccountOnboarding = async () => {
  isAccountOnboardingOpen.value = false;
  await markAccountSetupOnboardingSeen();
};

onMounted(async () => {
  const user = await getCurrentUser();
  currentUserEmail.value = user?.email ?? "";
  await loadAcademicYears();

  if (
    route.query.onboarding === "setup" &&
    !(await hasSeenAccountSetupOnboarding())
  ) {
    isAccountOnboardingOpen.value = true;
  }
});

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
</script>

<template>
  <div class="app-page">
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <div class="app-container space-y-4">
      <header class="app-header">
        <div>
          <h1 class="app-title">Akun</h1>
          <p class="app-subtitle">
            Kelola identitas organisasi, istilah aplikasi, dan sesi admin.
          </p>
        </div>
      </header>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Pengaturan Organisasi</CardTitle>
          <CardDescription>
            Identitas lembaga, tampilan browser, dan bahasa aplikasi.
          </CardDescription>
        </CardHeader>

        <CardContent class="divide-y p-0">
          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Organisasi
            </p>
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
              >
                <HugeiconsIcon
                  :icon="AccountSetting02Icon"
                  :size="24"
                  color="currentColor"
                  :stroke-width="1.7"
                />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-muted-foreground">
                  {{ organizationConfig.typeLabel }}
                </p>
                <h2 class="truncate text-base font-bold text-foreground">
                  {{ organizationConfig.name }}
                </h2>
                <p class="mt-1 truncate text-[13px] text-muted-foreground">
                  Login sebagai {{ accountEmail }}
                </p>
              </div>
            </div>
          </section>

          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tampilan Web
            </p>
            <div class="flex items-center gap-3">
              <img
                :src="organizationConfig.faviconUrl"
                alt="Favicon aktif"
                class="h-12 w-12 rounded-lg border bg-muted object-contain p-1"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-foreground">
                  {{ organizationConfig.appTitle }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Title dan favicon yang tampil di browser
                </p>
              </div>
            </div>
          </section>

          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bahasa Aplikasi
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Peserta</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.studentSingularTitle }}
                </p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Pengajar/Pembina</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.mentorSingularTitle }}
                </p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Tingkatan</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.levelSingularTitle }}
                </p>
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter class="border-t p-4">
          <Button as-child class="w-full sm:w-auto">
            <RouterLink to="/akun/istilah">
              Edit Pengaturan
            </RouterLink>
          </Button>
        </CardFooter>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Tahun Ajaran</CardTitle>
              <CardDescription>
                Atur tahun ajaran yang dipakai untuk filter semester, report,
                dan keuangan.
              </CardDescription>
            </div>
            <Button
              type="button"
              class="w-full sm:w-auto"
              :disabled="isAcademicYearSaving"
              @click="openAddAcademicYearModal"
            >
              <Plus class="h-4 w-4" :stroke-width="1.8" />
              Tambah Tahun Ajaran
            </Button>
          </div>
        </CardHeader>

        <CardContent class="space-y-4 p-4">
          <div
            v-if="isAcademicYearLoading"
            class="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground"
          >
            Memuat tahun ajaran...
          </div>

          <div v-else-if="sortedAcademicYears.length > 0" class="divide-y rounded-lg border">
            <div
              v-for="academicYear in sortedAcademicYears"
              :key="academicYear.id"
              class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-foreground">
                    {{ getAcademicYearLabel(academicYear.startYear) }}
                  </p>
                  <Badge v-if="academicYear.isActive" variant="secondary">
                    Aktif
                  </Badge>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ academicYear.startYear }} - {{ academicYear.startYear + 1 }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  v-if="!academicYear.isActive"
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="isAcademicYearSaving"
                  @click="handleSetActiveAcademicYear(academicYear)"
                >
                  <Check class="h-4 w-4" :stroke-width="1.8" />
                  Jadikan Aktif
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="isAcademicYearSaving"
                  @click="startEditAcademicYear(academicYear)"
                >
                  <Pencil class="h-4 w-4" :stroke-width="1.8" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  :disabled="isAcademicYearSaving"
                  @click="deletingAcademicYear = academicYear"
                >
                  <Trash2 class="h-4 w-4" :stroke-width="1.8" />
                  Hapus
                </Button>
              </div>
            </div>
          </div>

          <div v-else class="rounded-lg border px-4 py-8 text-center">
            <p class="text-sm font-medium text-foreground">
              Belum ada tahun ajaran.
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              Tambahkan tahun ajaran agar pilihan periode bisa dikelola dari
              Akun.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Data Master</CardTitle>
          <CardDescription>
            Kelola pilihan {{ terms.levelSingularLower }},
            {{ terms.mentorSingularLower }}, dan tipe peserta.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
              >
                <HugeiconsIcon
                  :icon="DatabaseIcon"
                  :size="21"
                  color="currentColor"
                  :stroke-width="1.7"
                />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-foreground">
                  Master Data
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  Data ini dipakai saat tambah dan import
                  {{ terms.studentSingularLower }}.
                </p>
              </div>
            </div>
            <Button as-child variant="outline" class="w-full sm:w-auto">
              <RouterLink to="/master-guru">
                Kelola Master Data
              </RouterLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Menu Aktif</CardTitle>
          <CardDescription>
            Fitur yang tersedia di dashboard organisasi saat ini.
          </CardDescription>
        </CardHeader>

        <div class="divide-y">
          <div
            v-for="item in activeFeatureItems"
            :key="item.key"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
            >
              <HugeiconsIcon
                :icon="item.icon"
                :size="20"
                color="currentColor"
                :stroke-width="1.7"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">
                {{ item.label }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Sesi</CardTitle>
          <CardDescription>
            Keluar dari perangkat ini saat selesai mengelola data.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-4">
          <Button
            type="button"
            variant="outline"
            class="w-full justify-center"
            @click="handleLogout"
          >
            <HugeiconsIcon
              :icon="Logout03Icon"
              :size="18"
              color="currentColor"
              :stroke-width="1.7"
            />
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>

    <ConfirmModal
      :is-open="Boolean(deletingAcademicYear)"
      title="Hapus Tahun Ajaran?"
      :message="`Tahun ajaran ${
        deletingAcademicYear
          ? getAcademicYearLabel(deletingAcademicYear.startYear)
          : ''
      } akan dihapus dari pengaturan.`"
      :confirm-text="isAcademicYearSaving ? 'Menghapus...' : 'Hapus'"
      @confirm="handleDeleteAcademicYear"
      @cancel="deletingAcademicYear = null"
    />

    <Dialog
      :open="isAddAcademicYearOpen"
      @update:open="handleAddAcademicYearOpenChange"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
          <DialogDescription>
            Isi tahun awal untuk membuat pilihan periode baru.
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSubmitAcademicYear">
          <div class="space-y-1.5">
            <Label>Tahun Awal</Label>
            <Input
              v-model.number="academicYearStartInput"
              type="number"
              min="2000"
              max="2100"
              step="1"
              placeholder="Contoh: 2026"
            />
            <p class="text-xs text-muted-foreground">
              Akan tampil sebagai
              {{ getAcademicYearLabel(Number(academicYearStartInput) || getCurrentAcademicYearStart()) }}.
            </p>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              :disabled="isAcademicYearSaving"
              @click="isAddAcademicYearOpen = false"
            >
              Batal
            </Button>
            <Button type="submit" :disabled="isAcademicYearSaving">
              <Plus class="h-4 w-4" :stroke-width="1.8" />
              {{ isAcademicYearSaving ? "Menambahkan..." : "Tambah" }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="isAccountOnboardingOpen"
      @update:open="(open) => { if (!open) closeAccountOnboarding() }"
    >
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Panduan Setup Akun</DialogTitle>
          <DialogDescription>
            Lengkapi bagian penting ini sebelum mulai menambahkan siswa.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 text-sm">
          <div class="rounded-lg border p-3">
            <p class="font-semibold text-foreground">Tahun Ajaran</p>
            <p class="mt-1 text-muted-foreground">
              Buat dan pilih tahun ajaran aktif untuk report penilaian, SPP,
              tabungan, export, dan dashboard.
            </p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="font-semibold text-foreground">Data Master</p>
            <p class="mt-1 text-muted-foreground">
              Isi tingkat, pengajar, dan tipe siswa agar form siswa dan filter
              data siap dipakai.
            </p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="font-semibold text-foreground">Bahasa Aplikasi</p>
            <p class="mt-1 text-muted-foreground">
              Sesuaikan istilah seperti siswa, guru, tingkat, dan label SPP
              dengan kebiasaan lembaga.
            </p>
          </div>
        </div>

        <Button type="button" class="w-full" @click="closeAccountOnboarding">
          Mengerti
        </Button>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="Boolean(editingAcademicYear)"
      @update:open="handleEditAcademicYearOpenChange"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tahun Ajaran</DialogTitle>
          <DialogDescription>
            Ubah tahun awal untuk memperbarui label tahun ajaran.
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleUpdateAcademicYear">
          <div class="space-y-1.5">
            <Label>Tahun Awal</Label>
            <Input
              v-model.number="editAcademicYearStartInput"
              type="number"
              min="2000"
              max="2100"
              step="1"
              placeholder="Contoh: 2026"
            />
            <p class="text-xs text-muted-foreground">
              Akan tampil sebagai
              {{ getAcademicYearLabel(Number(editAcademicYearStartInput) || getCurrentAcademicYearStart()) }}.
            </p>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              :disabled="isAcademicYearSaving"
              @click="editingAcademicYear = null"
            >
              Batal
            </Button>
            <Button type="submit" :disabled="isAcademicYearSaving">
              <Check class="h-4 w-4" :stroke-width="1.8" />
              {{ isAcademicYearSaving ? "Menyimpan..." : "Simpan" }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
