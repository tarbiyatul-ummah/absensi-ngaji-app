<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Cancel01Icon,
  Download05Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import {
  addSantriBulk,
  getJilid,
  getGuru,
  getSantri,
  updateSantri,
  deleteSantri,
} from "../services/masterService";
import type { Jilid, Guru, Santri } from "../types";

// Import komponen yang sudah dipisah
import SantriForm from "../components/master/SantriForm.vue";
import SantriList from "../components/master/SantriList.vue";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import MasterDataSummary from "../components/master/MasterDataSummary.vue";

const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const santriList = ref<Santri[]>([]);
const isAddModalOpen = ref(false);

const loadData = async () => {
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
  santriList.value = await getSantri();
};

onMounted(loadData);

const activeSantriList = computed(() =>
  santriList.value.filter((santri) => santri.isActive !== false),
);

const inactiveSantriCount = computed(
  () => santriList.value.filter((santri) => santri.isActive === false).length,
);

const jilidStats = computed(() =>
  jilidList.value
    .map((jilid) => ({
      nama: jilid.nama,
      count: activeSantriList.value.filter(
        (santri) => santri.jilidId === jilid.id,
      ).length,
    }))
    .sort((a, b) => b.count - a.count || a.nama.localeCompare(b.nama)),
);

const guruStats = computed(() =>
  guruList.value
    .map((guru) => ({
      nama: guru.nama,
      count: activeSantriList.value.filter(
        (santri) => santri.guruId === guru.id,
      ).length,
    }))
    .sort((a, b) => b.count - a.count || a.nama.localeCompare(b.nama)),
);

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

const formatCreatedAt = (createdAt?: number) => {
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const csvValue = (value: string | number) => {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
};

const exportSantriCsv = () => {
  const headers = [
    "Nama Santri",
    "Jilid",
    "Guru",
    "Status",
    "Tanggal Ditambahkan",
  ];
  const rows = [...santriList.value]
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map((santri) => [
      santri.nama,
      getJilidName(santri.jilidId),
      getGuruName(santri.guruId),
      santri.isActive !== false ? "Aktif" : "Nonaktif",
      formatCreatedAt(santri.createdAt),
    ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "data-santri.csv";
  link.click();
  URL.revokeObjectURL(url);
};

// Logika dari SantriForm
const handleAddSantri = async (payload: {
  nama: string;
  jilidId: string;
  guruId: string;
}) => {
  await addSantriBulk(payload.nama, payload.jilidId, payload.guruId);
  await loadData();
  isAddModalOpen.value = false;
  alert("Santri berhasil ditambahkan!");
};

// Logika dari SantriList
const handleToggleStatus = async (santri: Santri) => {
  await updateSantri(santri.id, { isActive: !santri.isActive });
  await loadData();
};

// const handleDeleteSantri = async (id: string) => {
//   if (confirm("Hapus santri ini secara permanen?")) {
//     await deleteSantri(id);
//     await loadData();
//   }
// };

const handleEditSantri = async (
  id: string,
  payload: { nama: string; jilidId: string; guruId: string },
) => {
  await updateSantri(id, payload);
  await loadData();
};

// Logika ConfirmModal (jika diperlukan untuk fitur lain, misal delete semua santri)
// State untuk Modal Hapus
const isDeleteModalOpen = ref(false);
const santriIdToDelete = ref<string | null>(null);

// 1. Saat tombol hapus di list ditekan (Buka Modal)
const promptDeleteSantri = (id: string) => {
  santriIdToDelete.value = id;
  isDeleteModalOpen.value = true;
};

// 2. Saat tombol 'Batal' di dalam Modal ditekan
const cancelDelete = () => {
  isDeleteModalOpen.value = false;
  santriIdToDelete.value = null;
};

// 3. Saat tombol 'Hapus' di dalam Modal ditekan (Eksekusi Hapus)
const executeDelete = async () => {
  if (santriIdToDelete.value) {
    await deleteSantri(santriIdToDelete.value);
    await loadData();
    isDeleteModalOpen.value = false;
    santriIdToDelete.value = null;
  }
};
</script>

<template>
  <div class="pb-24 font-sans">
    <!-- Header Shopify Style -->
    <header class="px-4 pt-5 pb-4 max-w-3xl mx-auto">
      <div class="flex items-center gap-3">
        <h1 class="text-[20px] font-bold text-[#202223]">Data Santri</h1>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2 sm:flex">
        <button
          type="button"
          @click="isAddModalOpen = true"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-[#008060] px-3 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] sm:flex-none"
        >
          <HugeiconsIcon
            :icon="PlusSignIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Tambah Santri
        </button>

        <button
          type="button"
          @click="exportSantriCsv"
          :disabled="santriList.length === 0"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-[#C9CCCF] bg-white px-3 py-2 text-[13px] font-medium text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Export CSV
        </button>

        <RouterLink
          to="/master-guru"
          class="col-span-2 inline-flex items-center justify-center rounded-md border border-[#C9CCCF] bg-white px-3 py-2 text-[13px] font-medium text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] sm:col-span-1 sm:flex-none"
        >
          Kelola Guru/Jilid
        </RouterLink>
      </div>
    </header>

    <div class="px-4 space-y-5 max-w-3xl mx-auto">
      <MasterDataSummary
        :total-active="activeSantriList.length"
        :total-inactive="inactiveSantriCount"
        :jilid-stats="jilidStats"
        :guru-stats="guruStats"
      />

      <!-- UBAH @deleteSantri agar memanggil promptDeleteSantri -->
      <SantriList
        :santriList="santriList"
        :jilidList="jilidList"
        :guruList="guruList"
        @toggleStatus="handleToggleStatus"
        @deleteSantri="promptDeleteSantri"
        @editSantri="handleEditSantri"
      />
    </div>

    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-40 flex items-end bg-[rgba(32,34,35,0.65)] px-0 sm:items-center sm:justify-center sm:px-4"
      @click.self="isAddModalOpen = false"
    >
      <div
        class="w-full rounded-t-xl bg-white shadow-2xl sm:max-w-lg sm:rounded-lg"
      >
        <div
          class="flex items-center justify-between border-b border-[#E1E3E5] px-5 py-4"
        >
          <div>
            <h2 class="text-[16px] font-bold text-[#202223]">
              Tambah Santri
            </h2>
            <p class="mt-0.5 text-[12px] text-[#6D7175]">
              Bisa tambah satu nama atau beberapa nama dipisahkan koma.
            </p>
          </div>
          <button
            type="button"
            @click="isAddModalOpen = false"
            class="rounded-md p-1 text-[#6D7175] hover:bg-[#F4F6F8] hover:text-[#202223]"
            aria-label="Tutup"
          >
            <HugeiconsIcon
              :icon="Cancel01Icon"
              :size="20"
              color="currentColor"
              :stroke-width="2"
            />
          </button>
        </div>

        <div class="px-5 py-5">
          <SantriForm
            variant="plain"
            :jilidList="jilidList"
            :guruList="guruList"
            @submit="handleAddSantri"
          />
        </div>
      </div>
    </div>

    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      title="Hapus Santri"
      message="Apakah Anda yakin ingin menghapus data santri ini secara permanen? Data yang sudah dihapus tidak dapat dikembalikan."
      confirmText="Hapus Permanen"
      @cancel="cancelDelete"
      @confirm="executeDelete"
    />
  </div>
</template>
