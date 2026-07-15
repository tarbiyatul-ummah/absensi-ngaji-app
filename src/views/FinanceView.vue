<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Download05Icon } from "@hugeicons/core-free-icons";
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
  getCurrentAcademicYearStart,
} from "../utils/academicPeriod";
import Toast from "../components/master/Toast.vue";

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

const totalTagihan = computed(
  () => activeSantriList.value.length * monthOptions.value.length,
);

const totalLunas = computed(() => {
  return activeSantriList.value.reduce((total, santri) => {
    return (
      total +
      monthOptions.value.filter((month) => isPaid(santri.id, month.value))
        .length
    );
  }, 0);
});

const totalBelumLunas = computed(() => totalTagihan.value - totalLunas.value);

const completionPercent = computed(() =>
  totalTagihan.value > 0
    ? Math.round((totalLunas.value / totalTagihan.value) * 100)
    : 0,
);

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
    "Nama Santri",
    "Jilid",
    "Guru",
    ...monthOptions.value.map((month) => month.label),
    "Total Lunas",
    "Belum Lunas",
  ];
  const rows = activeSantriList.value.map((santri) => {
    const paidCount = getPaidCount(santri.id);
    return [
      santri.nama,
      getJilidName(santri.jilidId),
      getGuruName(santri.guruId),
      ...monthOptions.value.map((month) =>
        isPaid(santri.id, month.value) ? "Lunas" : "Belum",
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
  link.download = `rekap-spp-${getAcademicYearLabel(
    selectedAcademicYearStart.value,
  ).replace("/", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  triggerToast("Data SPP berhasil diexport.");
};
</script>

<template>
  <div class="min-h-screen bg-[#F6F6F7] pb-44 font-sans">
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <header class="mx-auto max-w-5xl px-4 pb-4 pt-6">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-[20px] font-bold text-[#202223]">Keuangan SPP</h1>
          <p class="mt-1 text-[14px] text-[#6D7175]">
            Pantau pembayaran per bulan dalam satu tahun ajaran.
          </p>
        </div>
        <button
          type="button"
          @click="exportCsv"
          :disabled="isLoading || activeSantriList.length === 0"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-[#202223] px-3 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#454749] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Export CSV
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div
        class="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008060]"
      ></div>
    </div>

    <main v-else class="mx-auto max-w-5xl space-y-5 px-4 pb-28">
      <section
        class="grid grid-cols-2 overflow-hidden rounded-lg border border-[#E1E3E5] bg-white shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] md:grid-cols-4"
      >
        <div class="border-r border-[#F1F2F3] p-4">
          <p class="text-[12px] text-[#6D7175]">Tahun Ajaran</p>
          <p class="text-[20px] font-bold text-[#202223]">
            {{ getAcademicYearLabel(selectedAcademicYearStart) }}
          </p>
        </div>
        <div class="border-r-0 border-[#F1F2F3] p-4 md:border-r">
          <p class="text-[12px] text-[#6D7175]">Lunas</p>
          <p class="text-[20px] font-bold text-[#008060]">{{ totalLunas }}</p>
        </div>
        <div class="border-r border-t border-[#F1F2F3] p-4 md:border-t-0">
          <p class="text-[12px] text-[#6D7175]">Belum Lunas</p>
          <p class="text-[20px] font-bold text-[#D72C0D]">
            {{ totalBelumLunas }}
          </p>
        </div>
        <div class="border-t border-[#F1F2F3] p-4 md:border-t-0">
          <p class="text-[12px] text-[#6D7175]">Progress</p>
          <p class="text-[20px] font-bold text-[#202223]">
            {{ completionPercent }}%
          </p>
        </div>
      </section>

      <section
        class="rounded-lg border border-[#E1E3E5] bg-white shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)]"
      >
        <div
          class="grid grid-cols-1 gap-3 border-b border-[#E1E3E5] p-4 md:grid-cols-[220px_1fr]"
        >
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-[#202223]">
              Tahun Ajaran
            </label>
            <select
              v-model="selectedAcademicYearStart"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
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
            <label class="mb-1.5 block text-[13px] font-medium text-[#202223]">
              Cari Santri
            </label>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari nama, jilid, atau guru..."
              class="w-full rounded-md border border-[#C9CCCF] bg-white px-3 py-2.5 text-[14px] text-[#202223] outline-none placeholder:text-[#8C9196] focus:border-[#008060]"
            />
          </div>
        </div>

        <div
          v-if="isPaymentLoading"
          class="border-b border-[#E1E3E5] px-4 py-3 text-[13px] text-[#6D7175]"
        >
          Memuat pembayaran tahun ajaran...
        </div>

        <div class="space-y-3 p-4 md:hidden">
          <article
            v-for="santri in visibleSantriList"
            :key="santri.id"
            class="rounded-lg border border-[#E1E3E5] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-[14px] font-semibold text-[#202223]">
                  {{ santri.nama }}
                </h2>
                <p class="mt-0.5 text-[12px] text-[#6D7175]">
                  {{ getJilidName(santri.jilidId) }} -
                  {{ getGuruName(santri.guruId) }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full border border-[#E1E3E5] bg-[#F4F6F8] px-2 py-0.5 text-[12px] font-semibold text-[#202223]"
              >
                {{ getPaidCount(santri.id) }}/{{ monthOptions.length }}
              </span>
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
                    ? 'border-[#D0E4C9] bg-[#E3F1DF] text-[#008060]'
                    : 'border-[#D5D9DD] bg-white text-[#6D7175] active:bg-[#F4F6F8]'
                "
              >
                <span>{{ formatMonthShort(month.label) }}</span>
                <span class="mt-0.5 text-[10px]">
                  {{ isPaid(santri.id, month.value) ? "Lunas" : "Belum" }}
                </span>
              </button>
            </div>
          </article>

          <div
            v-if="filteredSantriList.length === 0"
            class="py-8 text-center text-[14px] text-[#6D7175]"
          >
            Tidak ada santri yang sesuai filter.
          </div>
        </div>

        <div class="hidden overflow-x-auto pb-28 md:block">
          <table class="min-w-245 w-full border-collapse text-left text-[13px]">
            <thead class="bg-[#FAFAFA] text-[#454749]">
              <tr>
                <th
                  class="sticky left-0 z-10 w-56 bg-[#FAFAFA] px-4 py-3 font-semibold"
                >
                  Santri
                </th>
                <th
                  v-for="month in monthOptions"
                  :key="month.value"
                  class="w-16 px-2 py-3 text-center font-semibold"
                >
                  {{ formatMonthShort(month.label) }}
                </th>
                <th class="w-24 px-3 py-3 text-right font-semibold">Lunas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F2F3]">
              <tr
                v-for="santri in visibleSantriList"
                :key="santri.id"
                class="hover:bg-[#F9FAFB]"
              >
                <td class="sticky left-0 z-10 bg-white px-4 py-3">
                  <p class="font-medium text-[#202223]">{{ santri.nama }}</p>
                  <p class="mt-0.5 text-[12px] text-[#6D7175]">
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
                        ? 'border-[#D0E4C9] bg-[#E3F1DF] text-[#008060]'
                        : 'border-[#D5D9DD] bg-white text-[#8C9196] hover:bg-[#F4F6F8]'
                    "
                    :aria-label="`${santri.nama} ${month.label}`"
                  >
                    {{ isPaid(santri.id, month.value) ? "L" : "-" }}
                  </button>
                </td>
                <td class="px-3 py-3 text-right font-semibold text-[#202223]">
                  {{ getPaidCount(santri.id) }}/{{ monthOptions.length }}
                </td>
              </tr>
              <tr v-if="filteredSantriList.length === 0">
                <td
                  :colspan="monthOptions.length + 2"
                  class="px-4 py-8 text-center text-[14px] text-[#6D7175]"
                >
                  Tidak ada santri yang sesuai filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="hasMoreSantri"
          ref="loadMoreTrigger"
          class="flex items-center justify-center border-t border-[#E1E3E5] px-4 py-4"
        >
          <button
            type="button"
            @click="loadMoreSantri"
            class="inline-flex items-center justify-center gap-2 rounded-md border border-[#C9CCCF] bg-white px-3 py-2 text-[13px] font-medium text-[#202223] hover:bg-[#F6F6F7]"
          >
            <span
              class="h-4 w-4 animate-spin rounded-full border-b-2 border-[#008060]"
            ></span>
            Muat lagi
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
