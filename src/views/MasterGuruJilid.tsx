import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
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
  getSantriTypes,
  addSantriType,
  updateSantriType,
  deleteSantriType,
} from "@/services/masterService";
import type { Guru, Jilid, SantriType } from "@/types";
import MasterDataCard, {
  type MasterDataItem,
} from "@/components/master/MasterDataCard";
import ConfirmModal from "@/components/master/ConfirmModal";
import InputModal from "@/components/master/InputModal";
import { useTerms } from "@/config/organization";

export const MasterGuruJilid: React.FC = () => {
  const terms = useTerms();

  const [jilidList, setJilidList] = useState<Jilid[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [santriTypeList, setSantriTypeList] = useState<SantriType[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePayload, setDeletePayload] = useState<{
    type: "jilid" | "guru" | "santriType";
    id: string;
  } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPayload, setEditPayload] = useState<{
    type: "jilid" | "guru" | "santriType";
    id: string;
    namaLama: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    const [jRes, gRes, tRes] = await Promise.all([
      getJilid(),
      getGuru(),
      getSantriTypes(),
    ]);
    setJilidList(jRes);
    setGuruList(gRes);
    setSantriTypeList(tRes);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddJilid = async (nama: string) => {
    await addJilid(nama);
    await loadData();
  };

  const handleAddGuru = async (nama: string) => {
    await addGuru(nama);
    await loadData();
  };

  const handleAddSantriType = async (nama: string) => {
    await addSantriType(nama);
    await loadData();
  };

  const handleMoveUpJilid = async (index: number) => {
    const current = jilidList[index];
    const prev = jilidList[index - 1];
    if (!current || !prev) return;
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
    const current = jilidList[index];
    const next = jilidList[index + 1];
    if (!current || !next) return;
    let urutanCurrent = current.urutan;
    let urutanNext = next.urutan;
    if (urutanCurrent === urutanNext) {
      urutanCurrent = index + 1;
      urutanNext = index + 2;
    }
    await swapUrutanJilid(current.id, urutanCurrent, next.id, urutanNext);
    await loadData();
  };

  const openDeleteModal = (
    type: "jilid" | "guru" | "santriType",
    id: string,
  ) => {
    setDeletePayload({ type, id });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deletePayload) return;
    const { type, id } = deletePayload;

    if (type === "jilid") await deleteJilid(id);
    else if (type === "guru") await deleteGuru(id);
    else await deleteSantriType(id);

    await loadData();
    setIsDeleteModalOpen(false);
    setDeletePayload(null);
  };

  const openEditModal = (
    type: "jilid" | "guru" | "santriType",
    item: MasterDataItem,
  ) => {
    setEditPayload({ type, id: item.id, namaLama: item.nama });
    setIsEditModalOpen(true);
  };

  const executeEdit = async (namaBaru: string) => {
    if (!editPayload) return;
    const { type, id, namaLama } = editPayload;

    if (namaBaru !== namaLama) {
      if (type === "jilid") await updateJilid(id, namaBaru);
      else if (type === "guru") await updateGuru(id, namaBaru);
      else await updateSantriType(id, namaBaru);
      await loadData();
    }

    setIsEditModalOpen(false);
    setEditPayload(null);
  };

  return (
    <div className="app-page">
      <header className="app-container flex items-center gap-3 pb-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/master">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={20}
              color="currentColor"
              strokeWidth={2}
            />
          </Link>
        </Button>
        <h1 className="app-title">Kelola Master Data</h1>
      </header>

      <div className="app-container space-y-6">
        <MasterDataCard
          title={`Data ${terms.levelSingularTitle}`}
          placeholder={`Masukkan nama ${terms.levelSingularLower} baru`}
          items={jilidList}
          isSortable={true}
          onAdd={handleAddJilid}
          onEdit={(item) => openEditModal("jilid", item)}
          onDelete={(id) => openDeleteModal("jilid", id)}
          onMoveUp={handleMoveUpJilid}
          onMoveDown={handleMoveDownJilid}
        />

        <MasterDataCard
          title={`Data ${terms.mentorSingularTitle}`}
          placeholder={`Masukkan nama ${terms.mentorSingularLower} baru`}
          items={guruList}
          onAdd={handleAddGuru}
          onEdit={(item) => openEditModal("guru", item)}
          onDelete={(id) => openDeleteModal("guru", id)}
        />

        <MasterDataCard
          title={`Data Tipe ${terms.studentSingularTitle}`}
          placeholder="Contoh: Reguler, Akselerasi, Tahfidz"
          items={santriTypeList}
          onAdd={handleAddSantriType}
          onEdit={(item) => openEditModal("santriType", item)}
          onDelete={(id) => openDeleteModal("santriType", id)}
        />
      </div>

      <InputModal
        isOpen={isEditModalOpen}
        title={
          editPayload?.type === "jilid"
            ? `Edit ${terms.levelSingularTitle}`
            : editPayload?.type === "guru"
              ? `Edit ${terms.mentorSingularTitle}`
              : `Edit Tipe ${terms.studentSingularTitle}`
        }
        label="Nama Baru"
        initialValue={editPayload?.namaLama || ""}
        onCancel={() => setIsEditModalOpen(false)}
        onConfirm={executeEdit}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={
          deletePayload?.type === "jilid"
            ? `Hapus ${terms.levelSingularTitle}`
            : deletePayload?.type === "guru"
              ? `Hapus ${terms.mentorSingularTitle}`
              : `Hapus Tipe ${terms.studentSingularTitle}`
        }
        message="Apakah Anda yakin ingin menghapus data ini secara permanen?"
        confirmText="Hapus"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default MasterGuruJilid;

