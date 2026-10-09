import { useCallback, useMemo, useState } from "react";
import type { Guru, Jilid, Santri } from "../types";

export interface UseSantriSelectionOptions {
  activeSantriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[];
}

export const useSantriSelection = ({
  activeSantriList,
  jilidList,
  guruList,
}: UseSantriSelectionOptions) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJilid, setSelectedJilid] = useState("semua");
  const [selectedGuru, setSelectedGuru] = useState("semua");
  const [selectedSantriIds, setSelectedSantriIdsState] = useState<Set<string>>(
    () => new Set(),
  );

  const jilidMap = useMemo(() => {
    return new Map(jilidList.map((j) => [j.id, j.nama]));
  }, [jilidList]);

  const guruMap = useMemo(() => {
    return new Map(guruList.map((g) => [g.id, g.nama]));
  }, [guruList]);

  const getJilidName = useCallback(
    (jilidId: string) => jilidMap.get(jilidId) ?? "-",
    [jilidMap],
  );

  const getGuruName = useCallback(
    (guruId: string) => guruMap.get(guruId) ?? "-",
    [guruMap],
  );

  const filteredSantriList = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return activeSantriList.filter((santri) => {
      const matchesJilid =
        selectedJilid === "semua" || santri.jilidId === selectedJilid;
      const matchesGuru =
        selectedGuru === "semua" || santri.guruId === selectedGuru;
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
  }, [activeSantriList, selectedJilid, selectedGuru, searchQuery, getJilidName, getGuruName]);

  const selectedCount = selectedSantriIds.size;

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedJilid("semua");
    setSelectedGuru("semua");
  }, []);

  const setSelectedSantriIds = useCallback((santriIds: string[]) => {
    setSelectedSantriIdsState(new Set(santriIds));
  }, []);

  const selectAllSantri = useCallback(() => {
    setSelectedSantriIdsState(new Set(activeSantriList.map((s) => s.id)));
  }, [activeSantriList]);

  const deselectAllSantri = useCallback(() => {
    setSelectedSantriIdsState(new Set());
  }, []);

  const toggleSantriSelection = useCallback((santriId: string) => {
    setSelectedSantriIdsState((prev) => {
      const next = new Set(prev);
      if (next.has(santriId)) {
        next.delete(santriId);
      } else {
        next.add(santriId);
      }
      return next;
    });
  }, []);

  return {
    deselectAllSantri,
    filteredSantriList,
    getGuruName,
    getJilidName,
    resetFilters,
    searchQuery,
    setSearchQuery,
    selectAllSantri,
    selectedCount,
    selectedGuru,
    setSelectedGuru,
    selectedJilid,
    setSelectedJilid,
    selectedSantriIds,
    setSelectedSantriIds,
    toggleSantriSelection,
  };
};

