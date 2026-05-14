<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getJilid,
  addJilid,
  updateJilid,
  deleteJilid,
  swapUrutanJilid,
  getGuru,
  addGuru,
  updateGuru,
  deleteGuru,
} from "../services/masterService";
import type { Jilid, Guru } from "../types";

import MasterDataCard from "../components/master/MasterDataCard.vue";
import ConfirmModal from "../components/master/ConfirmModal.vue";
import InputModal from "../components/master/InputModal.vue";

const jilidList = ref<Jilid[]>([]);
const guruList = ref<Guru[]>([]);

const loadData = async () => {
  jilidList.value = await getJilid();
  guruList.value = await getGuru();
};

onMounted(loadData);

// --- Logika Input Baru ---
const handleAddJilid = async (nama: string) => {
  await addJilid(nama);
  await loadData();
};
const handleAddGuru = async (nama: string) => {
  await addGuru(nama);
  await loadData();
};

// --- Logika Urutan (Move Up/Down Jilid) ---
const handleMoveUpJilid = async (index: number) => {
  const current = jilidList.value[index];
  const prev = jilidList.value[index - 1];
  let urutanCurrent = current.urutan;
  let urutanPrev = prev.urutan;
  if (urutanCurrent === urutanPrev) {
    urutanCurrent = index + 1;
    urutanPrev = index;
  }
  await swapUrutanJilid(current.id, urutanCurrent, prev.id, urutanPrev);
  await loadData();
};

const handleMoveDownJilid = async (index: number) => {
  const current = jilidList.value[index];
  const next = jilidList.value[index + 1];
  let urutanCurrent = current.urutan;
  let urutanNext = next.urutan;
  if (urutanCurrent === urutanNext) {
    urutanCurrent = index + 1;
    urutanNext = index + 2;
  }
  await swapUrutanJilid(current.id, urutanCurrent, next.id, urutanNext);
  await loadData();
};

// === STATE & LOGIKA MODAL HAPUS ===
const isDeleteModalOpen = ref(false);
const deletePayload = ref<{ type: "jilid" | "guru"; id: string } | null>(null);

const openDeleteModal = (type: "jilid" | "guru", id: string) => {
  deletePayload.value = { type, id };
  isDeleteModalOpen.value = true;
};

const executeDelete = async () => {
  if (!deletePayload.value) return;
  const { type, id } = deletePayload.value;

  if (type === "jilid") await deleteJilid(id);
  else await deleteGuru(id);

  await loadData();
  isDeleteModalOpen.value = false;
  deletePayload.value = null;
};

// === STATE & LOGIKA MODAL EDIT ===
const isEditModalOpen = ref(false);
const editPayload = ref<{
  type: "jilid" | "guru";
  id: string;
  namaLama: string;
} | null>(null);

const openEditModal = (
  type: "jilid" | "guru",
  item: { id: string; nama: string },
) => {
  editPayload.value = { type, id: item.id, namaLama: item.nama };
  isEditModalOpen.value = true;
};

const executeEdit = async (namaBaru: string) => {
  if (!editPayload.value) return;
  const { type, id, namaLama } = editPayload.value;

  if (namaBaru !== namaLama) {
    if (type === "jilid") await updateJilid(id, namaBaru);
    else await updateGuru(id, namaBaru);
    await loadData();
  }

  isEditModalOpen.value = false;
  editPayload.value = null;
};
</script>

<template>
  <div class="pb-24 font-sans">
    <header class="px-4 pt-5 pb-4 max-w-3xl mx-auto flex items-center gap-3">
      <RouterLink
        to="/master"
        class="p-1.5 rounded-md text-[#5C5F62] hover:bg-[#EDEEEF] transition-colors"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </RouterLink>
      <h1 class="text-[20px] font-bold text-[#202223]">Kelola Master Data</h1>
    </header>

    <div class="px-4 space-y-6 max-w-3xl mx-auto">
      <!-- Card Jilid -->
      <MasterDataCard
        title="Data Jilid"
        placeholder="Masukkan nama Jilid baru"
        :items="jilidList"
        :isSortable="true"
        @add="handleAddJilid"
        @edit="openEditModal('jilid', $event)"
        @delete="openDeleteModal('jilid', $event)"
        @move-up="handleMoveUpJilid"
        @move-down="handleMoveDownJilid"
      />

      <!-- Card Guru -->
      <MasterDataCard
        title="Data Guru"
        placeholder="Masukkan nama Guru baru"
        :items="guruList"
        @add="handleAddGuru"
        @edit="openEditModal('guru', $event)"
        @delete="openDeleteModal('guru', $event)"
      />
    </div>

    <!-- Panggil Modal Edit -->
    <InputModal
      :isOpen="isEditModalOpen"
      :title="editPayload?.type === 'jilid' ? 'Edit Jilid' : 'Edit Guru'"
      label="Nama Baru"
      :initialValue="editPayload?.namaLama || ''"
      @cancel="isEditModalOpen = false"
      @confirm="executeEdit"
    />

    <!-- Panggil Modal Hapus -->
    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      :title="deletePayload?.type === 'jilid' ? 'Hapus Jilid' : 'Hapus Guru'"
      message="Apakah Anda yakin ingin menghapus data ini secara permanen?"
      confirmText="Hapus"
      @cancel="isDeleteModalOpen = false"
      @confirm="executeDelete"
    />
  </div>
</template>
