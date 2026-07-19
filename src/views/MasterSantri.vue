<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import * as XLSX from "xlsx";
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
  addSantriItems,
  getJilid,
  getGuru,
  getSantri,
  getSantriTypes,
  updateSantri,
  deleteSantri,
} from "../services/masterService";
import type { Jilid, Guru, Santri, SantriType } from "../types";

// Import komponen yang sudah dipisah
import SantriForm from "../components/master/SantriForm.vue";
import SantriImportDialog from "../components/master/SantriImportDialog.vue";
import SantriList from "../components/master/SantriList.vue";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import MasterDataSummary from "../components/master/MasterDataSummary.vue";
import { terms } from "../config/organization";

const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const tipeList = ref<SantriType[]>([]);
const santriList = ref<Santri[]>([]);
const isAddModalOpen = ref(false);
const isImportModalOpen = ref(false);

const loadData = async () => {
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
  tipeList.value = await getSantriTypes();
  santriList.value = await getSantri();
};

onMounted(loadData);

const countActiveSantri = (items: Santri[]) =>
  items.filter((santri) => santri.isActive !== false).length;

const activeSantriCount = computed(() => countActiveSantri(santriList.value));

const jilidStats = computed(() =>
  jilidList.value
    .map((jilid) => {
      return {
        nama: jilid.nama,
        aktif: countActiveSantri(
          santriList.value.filter((santri) => santri.jilidId === jilid.id),
        ),
      };
    })
    .filter((item) => item.aktif > 0)
    .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama)),
);

const guruStats = computed(() =>
  guruList.value
    .map((guru) => {
      return {
        nama: guru.nama,
        aktif: countActiveSantri(
          santriList.value.filter((santri) => santri.guruId === guru.id),
        ),
      };
    })
    .filter((item) => item.aktif > 0)
    .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama)),
);

const tipeStats = computed(() => {
  const stats = tipeList.value.map((tipe) => {
    return {
      nama: tipe.nama,
      aktif: countActiveSantri(
        santriList.value.filter((santri) => santri.tipeId === tipe.id),
      ),
    };
  });

  const untypedActiveCount = countActiveSantri(
    santriList.value.filter((santri) => !santri.tipeId),
  );

  if (untypedActiveCount > 0) {
    stats.push({ nama: "Tanpa tipe", aktif: untypedActiveCount });
  }

  return stats
    .filter((item) => item.aktif > 0)
    .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama));
});

const getJilidName = (jilidId: string) =>
  jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

const getGuruName = (guruId: string) =>
  guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

const getTipeName = (tipeId?: string) => {
  if (!tipeId) return "Tanpa tipe";

  return tipeList.value.find((tipe) => tipe.id === tipeId)?.nama ?? "-";
};

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

const formatDateValue = (dateValue?: string) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const exportSantriExcel = () => {
  const rows = [...santriList.value]
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map((santri) => ({
      [`Nama ${terms.studentSingularTitle}`]: santri.nama,
      [terms.levelSingularTitle]: getJilidName(santri.jilidId),
      [terms.mentorSingularTitle]: getGuruName(santri.guruId),
      "Tipe Santri": getTipeName(santri.tipeId),
      "Tanggal Lahir": formatDateValue(santri.tanggalLahir),
      Status: santri.isActive !== false ? "Aktif" : "Nonaktif",
      "Tanggal Ditambahkan": formatCreatedAt(santri.createdAt),
    }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
  XLSX.writeFile(workbook, `data-${terms.studentSingularLower}.xlsx`);
};

// Logika dari SantriForm
const handleAddSantri = async (payload: {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
}) => {
  await addSantriBulk(
    payload.nama,
    payload.jilidId,
    payload.guruId,
    payload.tipeId,
    payload.tanggalLahir,
  );
  await loadData();
  isAddModalOpen.value = false;
  alert(`${terms.studentSingularTitle} berhasil ditambahkan!`);
};

const handleImportSantri = async (
  rows: {
    nama: string;
    jilidId: string;
    guruId: string;
    tipeId?: string;
    tanggalLahir?: string;
    isActive?: boolean;
  }[],
) => {
  await addSantriItems(rows);
  await loadData();
  isImportModalOpen.value = false;
  alert(`${rows.length} ${terms.studentSingularLower} berhasil diimport!`);
};

// Logika dari SantriList
const handleToggleStatus = async (santri: Santri) => {
  await updateSantri(santri.id, { isActive: santri.isActive === false });
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
  payload: {
    nama: string;
    jilidId: string;
    guruId: string;
    tipeId?: string;
    tanggalLahir?: string;
  },
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
          @click="exportSantriExcel"
          :disabled="santriList.length === 0"
          class="sm:flex-none"
        >
          <HugeiconsIcon
            :icon="Download05Icon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Export Excel
        </Button>

        <Button
          type="button"
          variant="outline"
          @click="isImportModalOpen = true"
          class="col-span-2 sm:col-span-1 sm:flex-none"
        >
          Import Excel
        </Button>
      </div>
    </header>

    <div class="app-container space-y-5">
      <MasterDataSummary
        :total-active="activeSantriCount"
        :jilid-stats="jilidStats"
        :guru-stats="guruStats"
        :tipe-stats="tipeStats"
      />

      <!-- UBAH @deleteSantri agar memanggil promptDeleteSantri -->
      <SantriList
        :santriList="santriList"
        :jilidList="jilidList"
        :guruList="guruList"
        :tipeList="tipeList"
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
          :tipeList="tipeList"
          @submit="handleAddSantri"
        />
      </DialogContent>
    </Dialog>

    <SantriImportDialog
      v-model:open="isImportModalOpen"
      :jilidList="jilidList"
      :guruList="guruList"
      :tipeList="tipeList"
      @import="handleImportSantri"
    />

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
