<script setup lang="ts">
import { ref, onMounted } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
import { terms } from "../config/organization";

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
  <div class="app-page">
    <header class="app-container flex items-center gap-3 pb-4">
      <Button as-child variant="ghost" size="icon">
        <RouterLink to="/master">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="20"
            color="currentColor"
            :stroke-width="2"
          />
        </RouterLink>
      </Button>
      <h1 class="app-title">Kelola Master Data</h1>
    </header>

    <div class="app-container space-y-6">
      <MasterDataCard
        :title="`Data ${terms.levelSingularTitle}`"
        :placeholder="`Masukkan nama ${terms.levelSingularLower} baru`"
        :items="jilidList"
        :isSortable="true"
        @add="handleAddJilid"
        @edit="openEditModal('jilid', $event)"
        @delete="openDeleteModal('jilid', $event)"
        @move-up="handleMoveUpJilid"
        @move-down="handleMoveDownJilid"
      />

      <MasterDataCard
        :title="`Data ${terms.mentorSingularTitle}`"
        :placeholder="`Masukkan nama ${terms.mentorSingularLower} baru`"
        :items="guruList"
        @add="handleAddGuru"
        @edit="openEditModal('guru', $event)"
        @delete="openDeleteModal('guru', $event)"
      />
    </div>

    <!-- Panggil Modal Edit -->
    <InputModal
      :isOpen="isEditModalOpen"
      :title="
        editPayload?.type === 'jilid'
          ? `Edit ${terms.levelSingularTitle}`
          : `Edit ${terms.mentorSingularTitle}`
      "
      label="Nama Baru"
      :initialValue="editPayload?.namaLama || ''"
      @cancel="isEditModalOpen = false"
      @confirm="executeEdit"
    />

    <!-- Panggil Modal Hapus -->
    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      :title="
        deletePayload?.type === 'jilid'
          ? `Hapus ${terms.levelSingularTitle}`
          : `Hapus ${terms.mentorSingularTitle}`
      "
      message="Apakah Anda yakin ingin menghapus data ini secara permanen?"
      confirmText="Hapus"
      @cancel="isDeleteModalOpen = false"
      @confirm="executeDelete"
    />
  </div>
</template>
