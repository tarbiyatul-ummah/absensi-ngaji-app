import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Guru, Jilid, Santri, SantriType } from "@/types";
import PaginationControls from "../common/PaginationControls";
import { useTerms } from "@/config/organization";
import { useSmoothMotion, springSnappy } from "@/lib/motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SantriListProps {
  santriList: Santri[];
  jilidList: Jilid[];
  guruList: Guru[];
  tipeList: SantriType[];
  onToggleStatus: (santri: Santri) => void;
  onDeleteSantri: (id: string) => void;
  onEditSantri: (
    id: string,
    data: {
      nama: string;
      jilidId: string;
      guruId: string;
      tipeId?: string;
      tanggalLahir?: string;
      tanggalMasuk?: string;
      tanggalKeluar?: string;
    },
  ) => void;
}

export const SantriList: React.FC<SantriListProps> = ({
  santriList,
  jilidList,
  guruList,
  tipeList,
  onToggleStatus,
  onDeleteSantri,
  onEditSantri,
}) => {
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    jilidId: "",
    guruId: "",
    tipeId: "",
    tanggalLahir: "",
    tanggalMasuk: "",
    tanggalKeluar: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"aktif" | "nonaktif">("aktif");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetailSantri, setSelectedDetailSantri] = useState<Santri | null>(null);
  const itemsPerPage = 10;

  const guruMap = useMemo(
    () => new Map(guruList.map((g) => [g.id, g.nama])),
    [guruList],
  );
  const jilidMap = useMemo(
    () => new Map(jilidList.map((j) => [j.id, j.nama])),
    [jilidList],
  );
  const tipeMap = useMemo(
    () => new Map(tipeList.map((t) => [t.id, t.nama])),
    [tipeList],
  );

  const getGuruName = (guruId: string) => guruMap.get(guruId) || "N/A";
  const getJilidName = (jilidId: string) => jilidMap.get(jilidId) || "N/A";
  const getTipeName = (tipeId?: string) =>
    tipeId ? tipeMap.get(tipeId) || "N/A" : "Tanpa tipe";

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

  const activeSantriCount = useMemo(
    () => santriList.filter((santri) => isSantriActive(santri)).length,
    [santriList],
  );

  const inactiveSantriCount = useMemo(
    () => santriList.filter((santri) => santri.isActive === false).length,
    [santriList],
  );

  const filteredSantriList = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const shouldShowActive = statusFilter === "aktif";

    return santriList.filter((santri) => {
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
  }, [santriList, statusFilter, searchQuery, guruMap, jilidMap, tipeMap]);

  const totalPages = Math.max(1, Math.ceil(filteredSantriList.length / itemsPerPage));

  const paginatedSantriList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSantriList.slice(start, start + itemsPerPage);
  }, [filteredSantriList, currentPage]);

  const visibleStart = filteredSantriList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const visibleEnd = Math.min(currentPage * itemsPerPage, filteredSantriList.length);

  const handleFilterChange = (filter: "aktif" | "nonaktif") => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setEditingId(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setEditingId(null);
  };

  const startEdit = (santri: Santri) => {
    setEditingId(santri.id);
    setEditForm({
      nama: santri.nama,
      jilidId: santri.jilidId,
      guruId: santri.guruId,
      tipeId: santri.tipeId ?? "",
      tanggalLahir: santri.tanggalLahir ?? "",
      tanggalMasuk: santri.tanggalMasuk ?? "",
      tanggalKeluar: santri.tanggalKeluar ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editForm.nama.trim() || !editForm.jilidId || !editForm.guruId) {
      alert("Lengkapi semua data!");
      return;
    }
    onEditSantri(id, {
      nama: editForm.nama.trim(),
      jilidId: editForm.jilidId,
      guruId: editForm.guruId,
      tipeId: editForm.tipeId || undefined,
      tanggalLahir: editForm.tanggalLahir || undefined,
      tanggalMasuk: editForm.tanggalMasuk || undefined,
      tanggalKeluar: editForm.tanggalKeluar || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center gap-3 bg-muted/30">
        <h2 className="text-[14px] font-semibold text-foreground">
          Daftar {terms.studentSingularTitle}
        </h2>
        <span className="bg-secondary text-secondary-foreground text-[12px] font-medium px-2 py-0.5 rounded-full">
          {filteredSantriList.length} orang
        </span>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1 relative">
          <button
            type="button"
            onClick={() => handleFilterChange("aktif")}
            className={`relative flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors z-10 ${
              statusFilter === "aktif"
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {statusFilter === "aktif" && !shouldReduceMotion && (
              <motion.div
                layoutId="santri-status-filter"
                className="absolute inset-0 bg-background rounded-md shadow-xs -z-10"
                transition={springSnappy}
              />
            )}
            Aktif ({activeSantriCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("nonaktif")}
            className={`relative flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors z-10 ${
              statusFilter === "nonaktif"
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {statusFilter === "nonaktif" && !shouldReduceMotion && (
              <motion.div
                layoutId="santri-status-filter"
                className="absolute inset-0 bg-background rounded-md shadow-xs -z-10"
                transition={springSnappy}
              />
            )}
            Non Aktif ({inactiveSantriCount})
          </button>
        </div>

        <input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          type="search"
          placeholder={`Cari nama ${terms.studentSingularLower}, ${terms.mentorSingularLower}, atau ${terms.levelSingularLower}...`}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="divide-y divide-border">
        {paginatedSantriList.map((santri) => (
          <motion.div
            key={santri.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="p-4 hover:bg-muted/40 transition-colors"
          >
            {editingId === santri.id ? (
              <div className="space-y-3 bg-muted/60 p-3 rounded-lg border border-border">
                <input
                  value={editForm.nama}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background p-2 text-[14px] text-foreground outline-none"
                  placeholder={`Nama ${terms.studentSingularTitle}`}
                />
                <div className="flex gap-2">
                  <select
                    value={editForm.jilidId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, jilidId: e.target.value })
                    }
                    className="w-full ui-select text-xs"
                  >
                    {jilidList.map((jilid) => (
                      <option key={jilid.id} value={jilid.id}>
                        {jilid.nama}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editForm.guruId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, guruId: e.target.value })
                    }
                    className="w-full ui-select text-xs"
                  >
                    {guruList.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={editForm.tipeId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tipeId: e.target.value })
                  }
                  className="w-full ui-select text-xs"
                >
                  <option value="">Tanpa tipe</option>
                  {tipeList.map((tipe) => (
                    <option key={tipe.id} value={tipe.id}>
                      {tipe.nama}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Tanggal Masuk</label>
                    <input
                      value={editForm.tanggalMasuk}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tanggalMasuk: e.target.value })
                      }
                      type="date"
                      className="w-full rounded-md border border-input bg-background p-2 text-[14px] text-foreground outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Tanggal Lahir</label>
                    <input
                      value={editForm.tanggalLahir}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tanggalLahir: e.target.value })
                      }
                      type="date"
                      className="w-full rounded-md border border-input bg-background p-2 text-[14px] text-foreground outline-none"
                    />
                  </div>
                </div>
                {!isSantriActive(santri) && (
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Tanggal Nonaktif / Keluar</label>
                    <input
                      value={editForm.tanggalKeluar}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tanggalKeluar: e.target.value })
                      }
                      type="date"
                      className="w-full rounded-md border border-input bg-background p-2 text-[14px] text-foreground outline-none"
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveEdit(santri.id)}
                  >
                    Simpan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  className="flex w-full justify-between items-center mb-3 text-left group"
                  onClick={() => setSelectedDetailSantri(santri)}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[14px] font-medium text-foreground transition-colors group-hover:text-primary ${
                        !isSantriActive(santri)
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {santri.nama}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {getGuruName(santri.guruId)} &bull;{" "}
                      {getTipeName(santri.tipeId)}
                    </span>
                  </div>
                  <span className="text-[12px] px-2 py-1 bg-muted rounded text-muted-foreground border border-border">
                    {getJilidName(santri.jilidId)}
                  </span>
                </button>

                <div className="flex gap-2 items-center mt-3 pt-3 border-t border-dashed border-border flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStatus(santri)}
                  >
                    {isSantriActive(santri) ? "Nonaktifkan" : "Aktifkan"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(santri)}
                    className="text-primary"
                  >
                    Edit Data
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSantri(santri.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {filteredSantriList.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-[14px]">
            Tidak ada {terms.studentSingularLower} yang sesuai dengan filter ini.
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSantriList.length}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        itemLabel={terms.studentSingularLower}
        onPageChange={setCurrentPage}
      />

      <Dialog
        open={Boolean(selectedDetailSantri)}
        onOpenChange={(open) => !open && setSelectedDetailSantri(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail {terms.studentSingularTitle}</DialogTitle>
          </DialogHeader>

          {selectedDetailSantri && (
            <div className="space-y-3 text-[14px]">
              <div>
                <p className="text-[12px] text-muted-foreground">Nama</p>
                <p className="font-medium text-foreground">
                  {selectedDetailSantri.nama}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[12px] text-muted-foreground">
                    {terms.mentorSingularTitle}
                  </p>
                  <p className="font-medium text-foreground">
                    {getGuruName(selectedDetailSantri.guruId)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted-foreground">
                    {terms.levelSingularTitle}
                  </p>
                  <p className="font-medium text-foreground">
                    {getJilidName(selectedDetailSantri.jilidId)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted-foreground">Tipe siswa</p>
                  <p className="font-medium text-foreground">
                    {getTipeName(selectedDetailSantri.tipeId)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted-foreground">Tanggal lahir</p>
                  <p className="font-medium text-foreground">
                    {formatTanggalLahir(selectedDetailSantri.tanggalLahir)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">
                    {isSantriActive(selectedDetailSantri) ? "Aktif" : "Non Aktif"}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted-foreground">Tanggal Masuk</p>
                  <p className="font-medium text-foreground">
                    {formatTanggalLahir(selectedDetailSantri.tanggalMasuk)}
                  </p>
                </div>

                {!isSantriActive(selectedDetailSantri) && (
                  <div>
                    <p className="text-[12px] text-muted-foreground">Tanggal Nonaktif / Keluar</p>
                    <p className="font-medium text-destructive">
                      {formatTanggalLahir(selectedDetailSantri.tanggalKeluar)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SantriList;

