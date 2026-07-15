import { computed, ref, type Ref } from "vue";
import type { Guru, Jilid, Santri } from "../types";

export const useSantriSelection = (
  activeSantriList: Ref<Santri[]>,
  jilidList: Ref<Jilid[]>,
  guruList: Ref<Guru[]>,
) => {
  const searchQuery = ref("");
  const selectedJilid = ref("semua");
  const selectedGuru = ref("semua");
  const selectedSantriIds = ref<Set<string>>(new Set());

  const getJilidName = (jilidId: string) =>
    jilidList.value.find((jilid) => jilid.id === jilidId)?.nama ?? "-";

  const getGuruName = (guruId: string) =>
    guruList.value.find((guru) => guru.id === guruId)?.nama ?? "-";

  const filteredSantriList = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();

    return activeSantriList.value.filter((santri) => {
      const matchesJilid =
        selectedJilid.value === "semua" ||
        santri.jilidId === selectedJilid.value;
      const matchesGuru =
        selectedGuru.value === "semua" || santri.guruId === selectedGuru.value;
      const searchableText = [
        santri.nama,
        getJilidName(santri.jilidId),
        getGuruName(santri.guruId),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesJilid &&
        matchesGuru &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  });

  const selectedCount = computed(() => selectedSantriIds.value.size);

  const resetFilters = () => {
    searchQuery.value = "";
    selectedJilid.value = "semua";
    selectedGuru.value = "semua";
  };

  const setSelectedSantriIds = (santriIds: string[]) => {
    selectedSantriIds.value = new Set(santriIds);
  };

  const selectAllSantri = () => {
    setSelectedSantriIds(activeSantriList.value.map((santri) => santri.id));
  };

  const deselectAllSantri = () => {
    selectedSantriIds.value = new Set();
  };

  const toggleSantriSelection = (santriId: string) => {
    const nextSelected = new Set(selectedSantriIds.value);
    if (nextSelected.has(santriId)) {
      nextSelected.delete(santriId);
    } else {
      nextSelected.add(santriId);
    }
    selectedSantriIds.value = nextSelected;
  };

  return {
    deselectAllSantri,
    filteredSantriList,
    getGuruName,
    getJilidName,
    resetFilters,
    searchQuery,
    selectAllSantri,
    selectedCount,
    selectedGuru,
    selectedJilid,
    selectedSantriIds,
    setSelectedSantriIds,
    toggleSantriSelection,
  };
};
