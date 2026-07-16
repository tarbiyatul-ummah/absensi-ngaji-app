import {
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  getDocs,
} from "firebase/firestore";
import type { Santri, Guru, Jilid, SantriType } from "../types";
import { userCollection, userDoc } from "./dataScope";

// --- Jilid & Guru (Contoh fungsi GET) ---
export const getJilid = async () => {
  const snapshot = await getDocs(userCollection("jilid"));
  const data = snapshot.docs.map((doc) => {
    const d = doc.data();
    // Jika data lama belum punya urutan, kita set default 0
    return { id: doc.id, urutan: d.urutan || 0, nama: d.nama } as Jilid;
  });

  // Mengurutkan array berdasarkan angka 'urutan'
  return data.sort((a, b) => a.urutan - b.urutan);
};

export const getGuru = async () => {
  const snapshot = await getDocs(userCollection("guru"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Guru);
};

// --- Tipe Santri ---
export const getSantriTypes = async () => {
  const snapshot = await getDocs(userCollection("santriTypes"));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SantriType)
    .sort((a, b) => a.nama.localeCompare(b.nama));
};

// --- Santri ---
export const getSantri = async () => {
  const snapshot = await getDocs(userCollection("santri"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Santri);
};

export interface SantriBulkItem {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
}

// Fitur 1: Bulk/Single Input Santri
export const addSantriBulk = async (
  namaInput: string,
  jilidId: string,
  guruId: string,
  tipeId?: string,
  tanggalLahir?: string,
) => {
  const names = namaInput
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n !== "");
  const promises = names.map((nama) => {
    return addDoc(userCollection("santri"), {
      nama,
      jilidId,
      guruId,
      ...(tipeId ? { tipeId } : {}),
      ...(tanggalLahir ? { tanggalLahir } : {}),
      isActive: true,
      createdAt: Date.now(),
    });
  });
  await Promise.all(promises);
};

export const addSantriItems = async (items: SantriBulkItem[]) => {
  const timestamp = Date.now();
  const promises = items.map((item) =>
    addDoc(userCollection("santri"), {
      nama: item.nama,
      jilidId: item.jilidId,
      guruId: item.guruId,
      ...(item.tipeId ? { tipeId: item.tipeId } : {}),
      ...(item.tanggalLahir ? { tanggalLahir: item.tanggalLahir } : {}),
      isActive: true,
      createdAt: timestamp,
    }),
  );

  await Promise.all(promises);
};

// Fitur 2 & 3: Edit dan Delete Santri
export const updateSantri = async (id: string, data: Partial<Santri>) => {
  const payload: Record<string, unknown> = { ...data };

  for (const field of ["tipeId", "tanggalLahir"]) {
    if (field in payload && !payload[field]) {
      payload[field] = deleteField();
    }
  }

  await updateDoc(userDoc("santri", id), payload);
};

export const deleteSantri = async (id: string) => {
  await deleteDoc(userDoc("santri", id));
};

// --- CRUD Jilid ---
export const addJilid = async (nama: string) => {
  const currentList = await getJilid();
  // Cari angka urutan terbesar saat ini
  const maxUrutan =
    currentList.length > 0 ? Math.max(...currentList.map((j) => j.urutan)) : 0;

  await addDoc(userCollection("jilid"), { nama, urutan: maxUrutan + 1 });
};

export const swapUrutanJilid = async (
  id1: string,
  urutan1: number,
  id2: string,
  urutan2: number,
) => {
  await updateDoc(userDoc("jilid", id1), { urutan: urutan2 });
  await updateDoc(userDoc("jilid", id2), { urutan: urutan1 });
};

export const updateJilid = async (id: string, nama: string) => {
  await updateDoc(userDoc("jilid", id), { nama });
};

export const deleteJilid = async (id: string) => {
  await deleteDoc(userDoc("jilid", id));
};

// --- CRUD Guru ---
export const addGuru = async (nama: string) => {
  await addDoc(userCollection("guru"), { nama });
};

export const updateGuru = async (id: string, nama: string) => {
  await updateDoc(userDoc("guru", id), { nama });
};

export const deleteGuru = async (id: string) => {
  await deleteDoc(userDoc("guru", id));
};

// --- CRUD Tipe Santri ---
export const addSantriType = async (nama: string) => {
  await addDoc(userCollection("santriTypes"), {
    nama,
    createdAt: Date.now(),
  });
};

export const updateSantriType = async (id: string, nama: string) => {
  await updateDoc(userDoc("santriTypes", id), { nama });
};

export const deleteSantriType = async (id: string) => {
  await deleteDoc(userDoc("santriTypes", id));
};
