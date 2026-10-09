import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download05Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
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
  softDeleteSantri,
} from "@/services/masterService";
import type { Guru, Jilid, Santri, SantriType } from "@/types";
import SantriForm from "@/components/master/SantriForm";
import SantriImportDialog, {
  type ImportRow,
} from "@/components/master/SantriImportDialog";
import SantriList from "@/components/master/SantriList";
import ConfirmModal from "@/components/master/ConfirmModal";
import MasterDataSummary from "@/components/master/MasterDataSummary";
import PageHeader from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import { useTerms } from "@/config/organization";

export const MasterSantri: React.FC = () => {
  const terms = useTerms();

  const [isLoading, setIsLoading] = useState(true);
  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [tipeList, setTipeList] = useState<SantriType[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [santriIdToDelete, setSantriIdToDelete] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [jRes, gRes, tRes, sRes] = await Promise.all([
        getJilid(),
        getGuru(),
        getSantriTypes(),
        getSantri(),
      ]);
      setJilidList(jRes);
      setGuruList(gRes);
      setTipeList(tRes);
      setSantriList(sRes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const countActiveSantri = (items: Santri[]) =>
    items.filter((santri) => santri.isActive !== false).length;

  const activeSantriCount = useMemo(
    () => countActiveSantri(santriList),
    [santriList],
  );

  const jilidStats = useMemo(
    () =>
      jilidList
        .map((jilid) => ({
          nama: jilid.nama,
          aktif: countActiveSantri(
            santriList.filter((santri) => santri.jilidId === jilid.id),
          ),
        }))
        .filter((item) => item.aktif > 0)
        .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama)),
    [jilidList, santriList],
  );

  const guruStats = useMemo(
    () =>
      guruList
        .map((guru) => ({
          nama: guru.nama,
          aktif: countActiveSantri(
            santriList.filter((santri) => santri.guruId === guru.id),
          ),
        }))
        .filter((item) => item.aktif > 0)
        .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama)),
    [guruList, santriList],
  );

  const tipeStats = useMemo(() => {
    const stats = tipeList.map((tipe) => ({
      nama: tipe.nama,
      aktif: countActiveSantri(
        santriList.filter((santri) => santri.tipeId === tipe.id),
      ),
    }));

    const untypedActiveCount = countActiveSantri(
      santriList.filter((santri) => !santri.tipeId),
    );

    if (untypedActiveCount > 0) {
      stats.push({ nama: "Tanpa tipe", aktif: untypedActiveCount });
    }

    return stats
      .filter((item) => item.aktif > 0)
      .sort((a, b) => b.aktif - a.aktif || a.nama.localeCompare(b.nama));
  }, [tipeList, santriList]);

  const jilidMap = useMemo(
    () => new Map(jilidList.map((j) => [j.id, j.nama])),
    [jilidList],
  );
  const guruMap = useMemo(
    () => new Map(guruList.map((g) => [g.id, g.nama])),
    [guruList],
  );
  const tipeMap = useMemo(
    () => new Map(tipeList.map((t) => [t.id, t.nama])),
    [tipeList],
  );

  const getJilidName = (jilidId: string) => jilidMap.get(jilidId) ?? "-";
  const getGuruName = (guruId: string) => guruMap.get(guruId) ?? "-";
  const getTipeName = (tipeId?: string) =>
    tipeId ? tipeMap.get(tipeId) ?? "-" : "Tanpa tipe";

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
    const rows = [...santriList]
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map((santri) => ({
        [`Nama ${terms.studentSingularTitle}`]: santri.nama,
        [terms.levelSingularTitle]: getJilidName(santri.jilidId),
        [terms.mentorSingularTitle]: getGuruName(santri.guruId),
        "Tipe Santri": getTipeName(santri.tipeId),
        "Tanggal Lahir": formatDateValue(santri.tanggalLahir),
        "Tanggal Masuk": formatDateValue(santri.tanggalMasuk),
        "Tanggal Keluar/Nonaktif": formatDateValue(santri.tanggalKeluar),
        Status: santri.isActive !== false ? "Aktif" : "Nonaktif",
        "Tanggal Ditambahkan": formatCreatedAt(santri.createdAt),
      }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
    XLSX.writeFile(workbook, `data-${terms.studentSingularLower}.xlsx`);
  };

  const handleAddSantri = async (payload: {
    nama: string;
    jilidId: string;
    guruId: string;
    tipeId?: string;
    tanggalLahir?: string;
    tanggalMasuk?: string;
  }) => {
    await addSantriBulk(
      payload.nama,
      payload.jilidId,
      payload.guruId,
      payload.tipeId,
      payload.tanggalLahir,
      payload.tanggalMasuk,
    );
    await loadData();
    setIsAddModalOpen(false);
    alert(`${terms.studentSingularTitle} berhasil ditambahkan!`);
  };

  const handleImportSantri = async (rows: ImportRow[]) => {
    await addSantriItems(rows);
    await loadData();
    setIsImportModalOpen(false);
    alert(`${rows.length} ${terms.studentSingularLower} berhasil diimport!`);
  };

  const handleToggleStatus = async (santri: Santri) => {
    const nextIsActive = santri.isActive === false;
    const today = new Date().toISOString().slice(0, 10);
    await updateSantri(santri.id, {
      isActive: nextIsActive,
      tanggalKeluar: nextIsActive ? undefined : today,
    });
    await loadData();
  };

  const handleEditSantri = async (
    id: string,
    payload: {
      nama: string;
      jilidId: string;
      guruId: string;
      tipeId?: string;
      tanggalLahir?: string;
      tanggalMasuk?: string;
      tanggalKeluar?: string;
    },
  ) => {
    await updateSantri(id, payload);
    await loadData();
  };

  const promptDeleteSantri = (id: string) => {
    setSantriIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSantriIdToDelete(null);
  };

  const executeDelete = async () => {
    if (santriIdToDelete) {
      const target = santriList.find((s) => s.id === santriIdToDelete);
      // Soft-delete if currently active so exit date is recorded in Supabase, permanent delete if already inactive
      if (target && target.isActive !== false) {
        await softDeleteSantri(santriIdToDelete);
      } else {
        await deleteSantri(santriIdToDelete, true);
      }
      await loadData();
      setIsDeleteModalOpen(false);
      setSantriIdToDelete(null);
    }
  };

  return (
    <div className="app-page">
      <header className="app-container">
        <PageHeader
          title={`Data ${terms.studentSingularTitle}`}
          actions={
            <>
              <Button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  size={17}
                  color="currentColor"
                  strokeWidth={2}
                />
                Tambah {terms.studentSingularTitle}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={exportSantriExcel}
                disabled={santriList.length === 0}
              >
                <HugeiconsIcon
                  icon={Download05Icon}
                  size={17}
                  color="currentColor"
                  strokeWidth={2}
                />
                Export Excel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
              >
                Import Excel
              </Button>
            </>
          }
        />
      </header>

      {isLoading ? (
        <LoadingState size="lg" text="Memuat Data" />
      ) : (
        <div className="app-container space-y-5">
          <MasterDataSummary
            totalActive={activeSantriCount}
            jilidStats={jilidStats}
            guruStats={guruStats}
            tipeStats={tipeStats}
          />

          <SantriList
            santriList={santriList}
            jilidList={jilidList}
            guruList={guruList}
            tipeList={tipeList}
            onToggleStatus={handleToggleStatus}
            onDeleteSantri={promptDeleteSantri}
            onEditSantri={handleEditSantri}
          />
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah {terms.studentSingularTitle}</DialogTitle>
            <DialogDescription>
              Bisa tambah satu nama atau beberapa nama dipisahkan koma.
            </DialogDescription>
          </DialogHeader>

          <SantriForm
            variant="plain"
            jilidList={jilidList}
            guruList={guruList}
            tipeList={tipeList}
            onSubmit={handleAddSantri}
          />
        </DialogContent>
      </Dialog>

      <SantriImportDialog
        open={isImportModalOpen}
        jilidList={jilidList}
        guruList={guruList}
        tipeList={tipeList}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportSantri}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Hapus ${terms.studentSingularTitle}`}
        message={`Apakah Anda yakin ingin menghapus data ${terms.studentSingularLower} ini secara permanen? Data yang sudah dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus Permanen"
        onCancel={cancelDelete}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default MasterSantri;

