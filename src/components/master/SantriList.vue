<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Santri, Jilid, Guru } from "../../types";
import PaginationControls from "../common/PaginationControls.vue";

const props = defineProps<{
  santriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[]; // Tambahan prop untuk dropdown edit
}>();

const emit = defineEmits<{
  (e: "toggleStatus", santri: Santri): void;
  (e: "deleteSantri", id: string): void;
  (
    e: "editSantri",
    id: string,
    data: { nama: string; jilidId: string; guruId: string },
  ): void;
}>();

// State untuk fitur edit
const editingId = ref<string | null>(null);
const editForm = ref({ nama: "", jilidId: "", guruId: "" });
const searchQuery = ref("");
const statusFilter = ref<"aktif" | "nonaktif">("aktif");
const currentPage = ref(1);
const itemsPerPage = 10;

const getGuruName = (guruId: string) =>
  props.guruList.find((g) => g.id === guruId)?.nama || "N/A";

const getJilidName = (jilidId: string) =>
  props.jilidList.find((j) => j.id === jilidId)?.nama || "N/A";

const activeSantriCount = computed(
  () => props.santriList.filter((santri) => santri.isActive !== false).length,
);

const inactiveSantriCount = computed(
  () => props.santriList.filter((santri) => santri.isActive === false).length,
);

const filteredSantriList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  const shouldShowActive = statusFilter.value === "aktif";

  return props.santriList.filter((santri) => {
    const isActive = santri.isActive !== false;
    const matchesStatus = shouldShowActive ? isActive : !isActive;
    const searchableText = [
      santri.nama,
      getGuruName(santri.guruId),
      getJilidName(santri.jilidId),
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
  };
};

// Membatalkan edit
const cancelEdit = () => {
  editingId.value = null;
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
  emit("editSantri", id, editForm.value);
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
      <h2 class="text-[14px] font-semibold text-[#202223]">Daftar Santri</h2>
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
        placeholder="Cari nama santri, guru, atau jilid..."
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
          <div class="flex justify-between items-center mb-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[14px] font-medium text-[#202223]"
                  :class="{ 'line-through text-[#8C9196]': !santri.isActive }"
                >
                  {{ santri.nama }}
                </span>
                <span
                  v-if="!santri.isActive"
                  class="bg-[#FFEA8A] text-[#8A6116] text-[11px] px-1.5 py-0.5 rounded"
                  >Tidak Aktif</span
                >
              </div>
              <span class="text-[12px] text-[#6D7175]">
                Guru: {{ getGuruName(santri.guruId) }}
              </span>
            </div>
            <span
              class="text-[12px] px-2 py-1 bg-[#F4F6F8] rounded text-[#6D7175] border border-[#E1E3E5]"
            >
              {{ getJilidName(santri.jilidId) }}
            </span>
          </div>

          <div
            class="flex gap-2 items-center mt-3 pt-3 border-t border-dashed border-[#E1E3E5] flex-wrap"
          >
            <button
              @click="emit('toggleStatus', santri)"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#202223] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
            >
              {{ santri.isActive ? "Nonaktifkan" : "Aktifkan" }}
            </button>

            <button
              @click="startEdit(santri)"
              class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-[#C9CCCF] bg-white text-[#2C6ECB] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#F9FAFB] transition-colors"
            >
              Edit Data
            </button>

            <button
              @click="emit('deleteSantri', santri.id)"
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
        Tidak ada santri yang sesuai dengan filter ini.
      </div>
    </div>

    <PaginationControls
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      :totalItems="filteredSantriList.length"
      :visibleStart="visibleStart"
      :visibleEnd="visibleEnd"
      itemLabel="santri"
    />
  </div>
</template>
