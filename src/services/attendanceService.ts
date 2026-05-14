import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Attendance } from "../types";

// Fitur 7: Auto-save absensi (Merge: true untuk update/insert otomatis)
export const saveAttendance = async (data: Omit<Attendance, "id">) => {
  const customId = `${data.date}_${data.santriId}`;
  const docRef = doc(db, "attendances", customId);

  await setDoc(docRef, { ...data, id: customId }, { merge: true });
};

// Fetch data absensi untuk hari tertentu
export const getAttendanceByDate = async (date: string) => {
  const q = query(collection(db, "attendances"), where("date", "==", date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Attendance);
};
