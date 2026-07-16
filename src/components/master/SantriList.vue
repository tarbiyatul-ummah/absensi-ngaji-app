<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Santri, Jilid, Guru, SantriType } from "../../types";
import PaginationControls from "../common/PaginationControls.vue";
import { terms } from "../../config/organization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{
  santriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[]; // Tambahan prop untuk dropdown edit
  tipeList: SantriType[];
}>();

const emit = defineEmits<{
  (e: "toggleStatus", santri: Santri): void;
  (e: "deleteSantri", id: string): void;
  (
    e: "editSantri",
    id: string,
    data: {
      nama: string;
      jilidId: string;
      guruId: string;
      tipeId?: string;
      tanggalLahir?: string;
    },
  ): void;
}>();

// State untuk fitur edit
const editingId = ref<string | null>(null);
const editForm = ref({
  nama: "",
  jilidId: "",
  guruId: "",
  tipeId: "",
  tanggalLahir: "",
});
const searchQuery = ref("");
const statusFilter = ref<"aktif" | "nonaktif">("aktif");
const currentPage = ref(1);
const selectedDetailSantri = ref<Santri | null>(null);
const itemsPerPage = 10;

const getGuruName = (guruId: string) =>
  props.guruList.find((g) => g.id === guruId)?.nama || "N/A";

const getJilidName = (jilidId: string) =>
  props.jilidList.find((j) => j.id === jilidId)?.nama || "N/A";

const getTipeName = (tipeId?: string) => {
  if (!tipeId) return "Tanpa tipe";

  return props.tipeList.find((tipe) => tipe.id === tipeId)?.nama || "N/A";
};

const formatTanggalLahir = (tanggalLahir?: string) => {
  if (!tanggalLahir) return "-";

  const date = new Date(`${tanggalLahir}T00:00:00`);
  if (Number.isNaN(date.getTime())) return tanggalLahir;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const isSantriActive = (santri: Santri) => santri.isActive !== false;

const activeSantriCount = computed(
  () => props.santriList.filter((santri) => isSantriActive(santri)).length,
);

const inactiveSantriCount = computed(
  () => props.santriList.filter((santri) => santri.isActive === false).length,
);

const filteredSantriList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  const shouldShowActive = statusFilter.value === "aktif";

  return props.santriList.filter((santri) => {
    const isActive = isSantriActive(santri);
    const matchesStatus = shouldShowActive ? isActive : !isActive;
    const searchableText = [
      santri.nama,
      getGuruName(santri.guruId),
      getJilidName(santri.jilidId),
      getTipeName(santri.tipeId),
      santri.tanggalLahir ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!keyword || searchableText.includes(keyword));
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSantriList.value.length / itemsPerPage)),
);

const paginatedSantriList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredSantriList.value.slice(start, start + itemsPerPage);
});

const visibleStart = computed(() => {
  if (filteredSantriList.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage + 1;
});

const visibleEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage, filteredSantriList.value.length),
);

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
  editingId.value = null;
  selectedDetailSantri.value = null;
});

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = pageCount;
  }
});

// Mengubah baris menjadi form
const startEdit = (santri: Santri) => {
  editingId.value = santri.id;
  editForm.value = {
    nama: santri.nama,
    jilidId: santri.jilidId,
    guruId: santri.guruId,
    tipeId: santri.tipeId ?? "",
    tanggalLahir: santri.tanggalLahir ?? "",
  };
};

// Membatalkan edit
const cancelEdit = () => {
  editingId.value = null;
};

const openDetail = (santri: Santri) => {
  selectedDetailSantri.value = santri;
};

const closeDetail = (isOpen: boolean) => {
  if (!isOpen) selectedDetailSantri.value = null;
};

// Mengirim data edit ke Parent
const saveEdit = (id: string) => {
  if (
    !editForm.value.nama ||
    !editForm.value.jilidId ||
    !editForm.value.guruId
  ) {
    return alert("Lengkapi semua data!");
  }
  emit("editSantri", id, {
    nama: editForm.value.nama,
    jilidId: editForm.value.jilidId,
    guruId: editForm.value.guruId,
    tipeId: editForm.value.tipeId || undefined,
    tanggalLahir: editForm.value.tanggalLahir || undefined,
  });
  editingId.value = null; // Tutup mode edit setelah simpan
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div
      class="p-4 border-b border-[#E1E3E5] flex justify-between items-center gap-3 bg-[#FAFAFA]"
    >
      <h2 class="text-[14px] font-semibold text-[#202223]">
        Daftar {{ terms.studentSingularTitle }}
      </h2>
      <span
        class="bg-[#E4E5E7] text-[#454749] text-[12px] font-medium px-2 py-0.5 rounded-full"
      >
        {{ filteredSantriList.length }} orang
      </span>
    </div>

    <div class="p-4 border-b border-[#E1E3E5] space-y-3">
      <div class="flex gap-2 rounded-md bg-[#F4F6F8] p-1">
        <button
          type="button"
          @click="statusFilter = 'aktif'"
          class="flex-1 rounded px-3 py-2 text-[13px] font-medium transition-colors"
          :class="
            statusFilter === 'aktif'
              ? 'bg-white text-[#202223] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'text-[#6D7175] hover:text-[#202223]'
          "
        >
          Aktif ({{ activeSantriCount }})
        </button>
        <button
          type="button"
          @click="statusFilter = 'nonaktif'"
          class="flex-1 rounded px-3 py-2 text-[13px] font-medium transition-colors"
          :class="
            statusFilter === 'nonaktif'
              ? 'bg-white text-[#202223] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'text-[#6D7175] hover:text-[#202223]'
          "
        >
          Non Aktif ({{ inactiveSantriCount }})
        </button>
      </div>

      <input
        v-model="searchQuery"
        type="search"
        :placeholder="`Cari nama ${terms.studentSingularLower}, ${terms.mentorSingularLower}, atau ${terms.levelSingularLower}...`"
        class="w-full rounded-md border border-[#C9CCCF] bg-white px-3 py-2 text-[14px] text-[#202223] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-[#8C9196] focus:border-[#008060]"
      />
    </div>

    <div class="divide-y divide-[#E1E3E5]">
      <div
        v-for="santri in paginatedSantriList"
        :key="santri.id"
        class="p-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <!-- === TAMPILAN MODE EDIT === -->
        <div
          v-if="editingId === santri.id"
          class="space-y-3 bg-[#F4F6F8] p-3 rounded-lg border border-[#E1E3E5]"
        >
          <input
            v-model="editForm.nama"
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] text-[#202223] focus:border-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
          <div class="flex gap-2">
            <select
              v-model="editForm.jilidId"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] focus:border-[#008060] outline-none"
            >
              <option
                v-for="jilid in jilidList"
                :key="jilid.id"
                :value="jilid.id"
              >
                {{ jilid.nama }}
              </option>
            </select>
            <select
              v-model="editForm.guruId"
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] focus:border-[#008060] outline-none"
            >
              <option v-for="guru in guruList" :key="guru.id" :value="guru.id">
                {{ guru.nama }}
              </option>
            </select>
          </div>
          <select
            v-model="editForm.tipeId"
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] focus:border-[#008060] outline-none"
          >
            <option value="">Tanpa tipe</option>
            <option v-for="tipe in tipeList" :key="tipe.id" :value="tipe.id">
              {{ tipe.nama }}
            </option>
          </select>
          <input
            v-model="editForm.tanggalLahir"
            type="date"
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[14px] focus:border-[#008060] outline-none"
          />
          <div class="flex gap-2 pt-2">
            <button
              @click="saveEdit(santri.id)"
              class="px-3 py-1.5 rounded-md bg-[#008060] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52]"
            >
              Simpan
            </button>
            <button
              @click="cancelEdit"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223]"
            >
              Batal
            </button>
          </div>
        </div>

        <!-- === TAMPILAN MODE NORMAL === -->
        <div v-else>
          <button
            type="button"
            class="flex w-full justify-between items-center mb-3 text-left"
            @click="openDetail(santri)"
          >
            <div class="flex flex-col gap-1">
              <span
                class="text-[14px] font-medium text-[#202223]"
                :class="{ 'line-through text-[#8C9196]': !isSantriActive(santri) }"
              >
                {{ santri.nama }}
              </span>
              <span class="text-[12px] text-[#6D7175]">
                {{ getGuruName(santri.guruId) }}
                &bull;
                {{ getTipeName(santri.tipeId) }}
              </span>
            </div>
            <span
              class="text-[12px] px-2 py-1 bg-[#F4F6F8] rounded text-[#6D7175] border border-[#E1E3E5]"
            >
              {{ getJilidName(santri.jilidId) }}
            </span>
          </button>

          <div
            class="flex gap-2 items-center mt-3 pt-3 border-t border-dashed border-[#E1E3E5] flex-wrap"
            @click.stop
          >
            <button
              @click.stop="emit('toggleStatus', santri)"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
            >
              {{ isSantriActive(santri) ? "Nonaktifkan" : "Aktifkan" }}
            </button>

            <button
              @click.stop="startEdit(santri)"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#2C6ECB] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
            >
              Edit Data
            </button>

            <button
              @click.stop="emit('deleteSantri', santri.id)"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#D82C0D] hover:bg-[#FFF4F4] transition-colors ml-auto"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="filteredSantriList.length === 0"
        class="p-8 text-center text-[#6D7175] text-[14px]"
      >
        Tidak ada {{ terms.studentSingularLower }} yang sesuai dengan filter
        ini.
      </div>
    </div>

    <PaginationControls
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      :totalItems="filteredSantriList.length"
      :visibleStart="visibleStart"
      :visibleEnd="visibleEnd"
      :itemLabel="terms.studentSingularLower"
    />

    <Dialog :open="!!selectedDetailSantri" @update:open="closeDetail">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detail {{ terms.studentSingularTitle }}</DialogTitle>
        </DialogHeader>

        <div v-if="selectedDetailSantri" class="space-y-3 text-[14px]">
          <div>
            <p class="text-[12px] text-[#6D7175]">Nama</p>
            <p class="font-medium text-[#202223]">
              {{ selectedDetailSantri.nama }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p class="text-[12px] text-[#6D7175]">
                {{ terms.mentorSingularTitle }}
              </p>
              <p class="font-medium text-[#202223]">
                {{ getGuruName(selectedDetailSantri.guruId) }}
              </p>
            </div>

            <div>
              <p class="text-[12px] text-[#6D7175]">
                {{ terms.levelSingularTitle }}
              </p>
              <p class="font-medium text-[#202223]">
                {{ getJilidName(selectedDetailSantri.jilidId) }}
              </p>
            </div>

            <div>
              <p class="text-[12px] text-[#6D7175]">Tipe siswa</p>
              <p class="font-medium text-[#202223]">
                {{ getTipeName(selectedDetailSantri.tipeId) }}
              </p>
            </div>

            <div>
              <p class="text-[12px] text-[#6D7175]">Tanggal lahir</p>
              <p class="font-medium text-[#202223]">
                {{ formatTanggalLahir(selectedDetailSantri.tanggalLahir) }}
              </p>
            </div>

            <div>
              <p class="text-[12px] text-[#6D7175]">Status</p>
              <p class="font-medium text-[#202223]">
                {{ isSantriActive(selectedDetailSantri) ? "Aktif" : "Non Aktif" }}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
