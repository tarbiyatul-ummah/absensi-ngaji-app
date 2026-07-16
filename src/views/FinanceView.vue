<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft02Icon, Download05Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGuru, getJilid, getSantri } from "../services/masterService";
import {
  getSppPaymentId,
  getSppPaymentsByAcademicYear,
  saveSppPayment,
} from "../services/financeService";
import type { Guru, Jilid, Santri, SppPayment } from "../types";
import {
  getAcademicMonthOptions,
  getAcademicYearLabel,
  getAcademicYearOptions,
  getCurrentAcademicMonth,
  getCurrentAcademicYearStart,
} from "../utils/academicPeriod";
import Toast from "../components/master/Toast.vue";
import { terms } from "../config/organization";

const SANTRI_BATCH_SIZE = 15;

const santriList = ref<Santri[]>([]);
const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const paymentList = ref<SppPayment[]>([]);
const selectedAcademicYearStart = ref(getCurrentAcademicYearStart());
const searchQuery = ref("");
const renderedSantriCount = ref(SANTRI_BATCH_SIZE);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const isLoading = ref(true);
const isPaymentLoading = ref(false);
const savingIds = ref<Set<string>>(new Set());
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
let loadMoreObserver: IntersectionObserver | null = null;

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

const monthOptions = computed(() =>
  getAcademicMonthOptions(selectedAcademicYearStart.value),
);

const paymentByKey = computed(() => {
  return paymentList.value.reduce(
    (acc, payment) => {
      acc[`${payment.santriId}_${payment.month}`] = payment;
      return acc;
    },
    {} as Record<string, SppPayment>,
  );
});

const activeSantriList = computed(() =>
  santriList.value
    .filter((santri) => santri.isActive !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama)),
);

const filteredSantriList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return activeSantriList.value;

  return activeSantriList.value.filter((santri) => {
    const searchableText = [
      santri.nama,
      getJilidName(santri.jilidId),
      getGuruName(santri.guruId),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });
});

const visibleSantriList = computed(() =>
  filteredSantriList.value.slice(0, renderedSantriCount.value),
);

const hasMoreSantri = computed(
  () => visibleSantriList.value.length < filteredSantriList.value.length,
);

const currentMonthValue = computed(() => getCurrentAcademicMonth());

const currentMonthLabel = computed(() => {
  return (
    monthOptions.value.find((month) => month.value === currentMonthValue.value)
      ?.label ?? "bulan ini"
  );
});

const currentMonthIndex = computed(() =>
  monthOptions.value.findIndex((month) => month.value === currentMonthValue.value),
);

const previousMonthValue = computed(() => {
  if (currentMonthIndex.value <= 0) return null;

  return monthOptions.value[currentMonthIndex.value - 1]?.value ?? null;
});

const paidThisMonthCount = computed(() =>
  activeSantriList.value.filter((santri) =>
    isPaid(santri.id, currentMonthValue.value),
  ).length,
);

const unpaidThisMonthCount = computed(
  () => activeSantriList.value.length - paidThisMonthCount.value,
);

const arrearsCount = computed(() => {
  if (!previousMonthValue.value) return 0;

  return activeSantriList.value.filter(
    (santri) => !isPaid(santri.id, previousMonthValue.value as string),
  ).length;
});

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

const getPayment = (santriId: string, month: string) =>
  paymentByKey.value[`${santriId}_${month}`];

const isPaid = (santriId: string, month: string) =>
  getPayment(santriId, month)?.isPaid === true;

const getPaidCount = (santriId: string) =>
  monthOptions.value.filter((month) => isPaid(santriId, month.value)).length;

const formatMonthShort = (monthLabel: string) => {
  return monthLabel.split(" ")[0].slice(0, 3);
};

const loadPayments = async () => {
  isPaymentLoading.value = true;

  try {
    paymentList.value = await getSppPaymentsByAcademicYear(
      selectedAcademicYearStart.value,
    );
  } catch (error) {
    triggerToast("Data pembayaran belum bisa dimuat.", "error");
  } finally {
    isPaymentLoading.value = false;
  }
};

const loadMoreSantri = () => {
  if (!hasMoreSantri.value) return;

  renderedSantriCount.value = Math.min(
    renderedSantriCount.value + SANTRI_BATCH_SIZE,
    filteredSantriList.value.length,
  );
  void observeLoadMoreTrigger();
};

const observeLoadMoreTrigger = async () => {
  await nextTick();

  loadMoreObserver?.disconnect();
  if (!loadMoreObserver || !loadMoreTrigger.value || !hasMoreSantri.value) {
    return;
  }

  loadMoreObserver.observe(loadMoreTrigger.value);
};

const setupLazyLoadObserver = () => {
  if (typeof IntersectionObserver === "undefined") return;

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMoreSantri();
      }
    },
    { rootMargin: "320px 0px" },
  );
};

onMounted(async () => {
  setupLazyLoadObserver();

  try {
    const [santriRes, jilidRes, guruRes] = await Promise.all([
      getSantri(),
      getJilid(),
      getGuru(),
    ]);
    santriList.value = santriRes;
    jilidList.value = jilidRes;
    guruList.value = guruRes;
    await loadPayments();
  } catch (error) {
    triggerToast(
      "Koneksi bermasalah. Data keuangan belum bisa dimuat.",
      "error",
    );
  } finally {
    isLoading.value = false;
    await observeLoadMoreTrigger();
  }
});

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect();
});

watch(selectedAcademicYearStart, () => {
  if (!isLoading.value) loadPayments();
});

watch(filteredSantriList, () => {
  renderedSantriCount.value = SANTRI_BATCH_SIZE;
  void observeLoadMoreTrigger();
});

watch(hasMoreSantri, () => {
  void observeLoadMoreTrigger();
});

const togglePayment = async (santri: Santri, month: string) => {
  const id = getSppPaymentId(selectedAcademicYearStart.value, month, santri.id);
  const previousPayments = paymentList.value.map((payment) => ({ ...payment }));
  const nextIsPaid = !isPaid(santri.id, month);
  const nextPayment: SppPayment = {
    id,
    santriId: santri.id,
    academicYearStart: selectedAcademicYearStart.value,
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

  savingIds.value.add(id);

  try {
    await saveSppPayment({
      santriId: santri.id,
      academicYearStart: selectedAcademicYearStart.value,
      month,
      isPaid: nextIsPaid,
      paidAt: nextPayment.paidAt,
    });
  } catch (error) {
    paymentList.value = previousPayments;
    triggerToast("Pembayaran gagal disimpan.", "error");
  } finally {
    savingIds.value.delete(id);
  }
};

const csvValue = (value: string | number) => {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
};

const exportCsv = () => {
  const headers = [
    `Nama ${terms.studentSingularTitle}`,
    terms.levelSingularTitle,
    terms.mentorSingularTitle,
    ...monthOptions.value.map((month) => month.label),
    "Total Bayar",
    "Belum Bayar",
  ];
  const rows = activeSantriList.value.map((santri) => {
    const paidCount = getPaidCount(santri.id);
    return [
      santri.nama,
      getJilidName(santri.jilidId),
      getGuruName(santri.guruId),
      ...monthOptions.value.map((month) =>
        isPaid(santri.id, month.value) ? "Sudah Bayar" : "Belum Bayar",
      ),
      paidCount,
      monthOptions.value.length - paidCount,
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rekap-${terms.paymentLabel.toLowerCase()}-${getAcademicYearLabel(
    selectedAcademicYearStart.value,
  ).replace("/", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  triggerToast(`Data ${terms.paymentLabel} berhasil diexport.`);
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

    <header class="app-container-wide space-y-4 pb-4">
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

      <div class="app-header">
        <div>
          <h1 class="app-title">Keuangan {{ terms.paymentLabel }}</h1>
          <p class="app-subtitle">
            Pantau pembayaran bulanan dan tunggakan {{ terms.studentSingularLower }}.
          </p>
        </div>
        <Button
          type="button"
          @click="exportCsv"
          :disabled="isLoading || activeSantriList.length === 0"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Export CSV
        </Button>
      </div>
    </header>

    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div
        class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
      ></div>
    </div>

    <main v-else class="app-container-wide space-y-5 pb-28">
      <Card class="grid grid-cols-1 sm:grid-cols-3">
        <div class="border-b p-4 sm:border-b-0 sm:border-r">
          <p class="text-xs leading-snug text-muted-foreground">
            Sudah bayar bulan ini
          </p>
          <p
            class="mt-0.5 text-2xl font-bold leading-tight text-[hsl(142_72%_29%)]"
          >
            {{ paidThisMonthCount }}
          </p>
          <p class="mt-1 text-[11px] text-muted-foreground">
            {{ currentMonthLabel }}
          </p>
        </div>
        <div class="border-b p-4 sm:border-b-0 sm:border-r">
          <p class="text-xs leading-snug text-muted-foreground">
            Belum bayar bulan ini
          </p>
          <p class="mt-0.5 text-2xl font-bold leading-tight text-destructive">
            {{ unpaidThisMonthCount }}
          </p>
          <p class="mt-1 text-[11px] text-muted-foreground">
            Dari {{ activeSantriList.length }} {{ terms.studentSingularLower }} aktif
          </p>
        </div>
        <div class="p-4">
          <p class="text-xs leading-snug text-muted-foreground">
            Jumlah menunggak
          </p>
          <p class="mt-0.5 text-2xl font-bold leading-tight text-foreground">
            {{ arrearsCount }}
          </p>
          <p class="mt-1 text-[11px] text-muted-foreground">
            Belum bayar bulan sebelumnya
          </p>
        </div>
      </Card>

      <Card>
        <div
          class="grid grid-cols-1 gap-3 border-b p-4 md:grid-cols-[220px_1fr]"
        >
          <div>
            <Label> Tahun Ajaran </Label>
            <select v-model="selectedAcademicYearStart" class="ui-select">
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
            <Label> Cari {{ terms.studentSingularTitle }} </Label>
            <Input
              v-model="searchQuery"
              type="search"
              :placeholder="`Cari nama, ${terms.levelSingularLower}, atau ${terms.mentorSingularLower}...`"
            />
          </div>
        </div>

        <div
          v-if="isPaymentLoading"
          class="border-b px-4 py-3 text-[13px] text-muted-foreground"
        >
          Memuat pembayaran tahun ajaran...
        </div>

        <div class="space-y-3 p-4 md:hidden">
          <article
            v-for="santri in visibleSantriList"
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
                {{ getPaidCount(santri.id) }}/{{ monthOptions.length }}
              </Badge>
            </div>

            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="month in monthOptions"
                :key="`${santri.id}-${month.value}`"
                type="button"
                @click="togglePayment(santri, month.value)"
                :disabled="
                  savingIds.has(
                    getSppPaymentId(
                      selectedAcademicYearStart,
                      month.value,
                      santri.id,
                    ),
                  )
                "
                class="flex h-12 flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
                :class="
                  isPaid(santri.id, month.value)
                    ? 'border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)]'
                    : 'border-border bg-background text-muted-foreground active:bg-accent'
                "
              >
                <span>{{ formatMonthShort(month.label) }}</span>
                <span class="mt-0.5 text-[10px]">
                {{ isPaid(santri.id, month.value) ? "Bayar" : "Belum" }}
                </span>
              </button>
            </div>
          </article>

          <div
            v-if="filteredSantriList.length === 0"
            class="py-8 text-center text-sm text-muted-foreground"
          >
            Tidak ada {{ terms.studentSingularLower }} yang sesuai filter.
          </div>
        </div>

        <div class="hidden overflow-x-auto pb-28 md:block">
          <table class="min-w-245 w-full border-collapse text-left text-[13px]">
            <thead class="bg-muted text-muted-foreground">
              <tr>
                <th
                  class="sticky left-0 z-10 w-56 bg-muted px-4 py-3 font-semibold"
                >
                  {{ terms.studentSingularTitle }}
                </th>
                <th
                  v-for="month in monthOptions"
                  :key="month.value"
                  class="w-16 px-2 py-3 text-center font-semibold"
                >
                  {{ formatMonthShort(month.label) }}
                </th>
                <th class="w-24 px-3 py-3 text-right font-semibold">Bayar</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="santri in visibleSantriList"
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
                  v-for="month in monthOptions"
                  :key="`${santri.id}-${month.value}`"
                  class="px-2 py-2 text-center"
                >
                  <button
                    type="button"
                    @click="togglePayment(santri, month.value)"
                    :disabled="
                      savingIds.has(
                        getSppPaymentId(
                          selectedAcademicYearStart,
                          month.value,
                          santri.id,
                        ),
                      )
                    "
                    class="mx-auto flex h-8 w-8 items-center justify-center rounded-md border text-[12px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60"
                    :class="
                      isPaid(santri.id, month.value)
                        ? 'border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)]'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent'
                    "
                    :aria-label="`${santri.nama} ${month.label}`"
                  >
                    {{ isPaid(santri.id, month.value) ? "L" : "-" }}
                  </button>
                </td>
                <td class="px-3 py-3 text-right font-semibold text-foreground">
                  {{ getPaidCount(santri.id) }}/{{ monthOptions.length }}
                </td>
              </tr>
              <tr v-if="filteredSantriList.length === 0">
                <td
                  :colspan="monthOptions.length + 2"
                  class="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Tidak ada {{ terms.studentSingularLower }} yang sesuai filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="hasMoreSantri"
          ref="loadMoreTrigger"
          class="flex items-center justify-center border-t px-4 py-4"
        >
          <Button type="button" @click="loadMoreSantri" variant="outline">
            <span
              class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"
            ></span>
            Muat lagi
          </Button>
        </div>
      </Card>
    </main>
  </div>
</template>
