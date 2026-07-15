<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Download05Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { terms } from "../config/organization";

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
    `Nama ${terms.studentSingularTitle}`,
    terms.levelSingularTitle,
    terms.mentorSingularTitle,
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
  link.download = `data-${terms.studentSingularLower}.csv`;
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
  alert(`${terms.studentSingularTitle} berhasil ditambahkan!`);
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
  <div class="app-page">
    <!-- Header Shopify Style -->
    <header class="app-container pb-4">
      <div class="app-header">
        <div>
        <h1 class="app-title">
          Data {{ terms.studentSingularTitle }}
        </h1>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          @click="isAddModalOpen = true"
          class="sm:flex-none"
        >
          <HugeiconsIcon
            :icon="PlusSignIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Tambah {{ terms.studentSingularTitle }}
        </Button>

        <Button
          type="button"
          variant="outline"
          @click="exportSantriCsv"
          :disabled="santriList.length === 0"
          class="sm:flex-none"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Export CSV
        </Button>

        <Button as-child variant="outline" class="col-span-2 sm:col-span-1 sm:flex-none">
          <RouterLink to="/master-guru">
            Kelola {{ terms.mentorSingularTitle }}/{{ terms.levelSingularTitle }}
          </RouterLink>
        </Button>
      </div>
    </header>

    <div class="app-container space-y-5">
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

    <Dialog v-model:open="isAddModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah {{ terms.studentSingularTitle }}</DialogTitle>
          <DialogDescription>
            Bisa tambah satu nama atau beberapa nama dipisahkan koma.
          </DialogDescription>
        </DialogHeader>

        <SantriForm
          variant="plain"
          :jilidList="jilidList"
          :guruList="guruList"
          @submit="handleAddSantri"
        />
      </DialogContent>
    </Dialog>

    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      :title="`Hapus ${terms.studentSingularTitle}`"
      :message="`Apakah Anda yakin ingin menghapus data ${terms.studentSingularLower} ini secara permanen? Data yang sudah dihapus tidak dapat dikembalikan.`"
      confirmText="Hapus Permanen"
      @cancel="cancelDelete"
      @confirm="executeDelete"
    />
  </div>
</template>
