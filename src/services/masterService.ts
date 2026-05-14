import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Santri, Guru, Jilid } from "../types";

// --- Jilid & Guru (Contoh fungsi GET) ---
export const getJilid = async () => {
  const snapshot = await getDocs(collection(db, "jilid"));
  const data = snapshot.docs.map((doc) => {
    const d = doc.data();
    // Jika data lama belum punya urutan, kita set default 0
    return { id: doc.id, urutan: d.urutan || 0, nama: d.nama } as Jilid;
  });

  // Mengurutkan array berdasarkan angka 'urutan'
  return data.sort((a, b) => a.urutan - b.urutan);
};

export const getGuru = async () => {
  const snapshot = await getDocs(collection(db, "guru"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Guru);
};

// --- Santri ---
export const getSantri = async () => {
  const snapshot = await getDocs(collection(db, "santri"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Santri);
};

// Fitur 1: Bulk/Single Input Santri
export const addSantriBulk = async (
  namaInput: string,
  jilidId: string,
  guruId: string,
) => {
  const names = namaInput
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n !== "");
  const promises = names.map((nama) => {
    return addDoc(collection(db, "santri"), {
      nama,
      jilidId,
      guruId,
      isActive: true,
      createdAt: Date.now(),
    });
  });
  await Promise.all(promises);
};

// Fitur 2 & 3: Edit dan Delete Santri
export const updateSantri = async (id: string, data: Partial<Santri>) => {
  await updateDoc(doc(db, "santri", id), data);
};

export const deleteSantri = async (id: string) => {
  await deleteDoc(doc(db, "santri", id));
};

// --- CRUD Jilid ---
export const addJilid = async (nama: string) => {
  const currentList = await getJilid();
  // Cari angka urutan terbesar saat ini
  const maxUrutan =
    currentList.length > 0 ? Math.max(...currentList.map((j) => j.urutan)) : 0;

  await addDoc(collection(db, "jilid"), { nama, urutan: maxUrutan + 1 });
};

export const swapUrutanJilid = async (
  id1: string,
  urutan1: number,
  id2: string,
  urutan2: number,
) => {
  await updateDoc(doc(db, "jilid", id1), { urutan: urutan2 });
  await updateDoc(doc(db, "jilid", id2), { urutan: urutan1 });
};

export const updateJilid = async (id: string, nama: string) => {
  await updateDoc(doc(db, "jilid", id), { nama });
};

export const deleteJilid = async (id: string) => {
  await deleteDoc(doc(db, "jilid", id));
};

// --- CRUD Guru ---
export const addGuru = async (nama: string) => {
  await addDoc(collection(db, "guru"), { nama });
};

export const updateGuru = async (id: string, nama: string) => {
  await updateDoc(doc(db, "guru", id), { nama });
};

export const deleteGuru = async (id: string) => {
  await deleteDoc(doc(db, "guru", id));
};
