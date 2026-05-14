<script setup lang="ts">
import { ref, onMounted } from "vue";
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

const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);
const santriList = ref<Santri[]>([]);

const loadData = async () => {
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
  santriList.value = await getSantri();
};

onMounted(loadData);

// Logika dari SantriForm
const handleAddSantri = async (payload: {
  nama: string;
  jilidId: string;
  guruId: string;
}) => {
  await addSantriBulk(payload.nama, payload.jilidId, payload.guruId);
  await loadData();
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
    <header
      class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <h1 class="text-[20px] font-bold text-[#202223]">Data Santri</h1>
      </div>

      <RouterLink
        to="/master-guru"
        class="text-[14px] font-medium text-[#2C6ECB] hover:underline flex items-center gap-1"
      >
        Kelola Guru/Jilid
      </RouterLink>
    </header>

    <div class="px-4 space-y-5 max-w-3xl mx-auto">
      <SantriForm
        :jilidList="jilidList"
        :guruList="guruList"
        @submit="handleAddSantri"
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
