import {
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  where,
  type Unsubscribe,
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

export const listenAttendanceByDate = (
  date: string,
  onData: (data: Attendance[]) => void,
  onError: () => void,
): Unsubscribe => {
  const q = query(collection(db, "attendances"), where("date", "==", date));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data() as Attendance));
    },
    () => {
      onError();
    },
  );
};

export const getAttendanceByDateRange = async (
  startDate: string,
  endDate: string,
) => {
  const q = query(
    collection(db, "attendances"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Attendance);
};
