import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SppPayment } from "../types";

export const getSppPaymentId = (
  academicYearStart: number,
  month: string,
  santriId: string,
) => `${academicYearStart}_${month}_${santriId}`;

export const getSppPaymentsByAcademicYear = async (
  academicYearStart: number,
) => {
  const q = query(
    collection(db, "sppPayments"),
    where("academicYearStart", "==", academicYearStart),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as SppPayment);
};

export const saveSppPayment = async (
  data: Omit<SppPayment, "id" | "updatedAt">,
) => {
  const id = getSppPaymentId(
    data.academicYearStart,
    data.month,
    data.santriId,
  );
  const docRef = doc(db, "sppPayments", id);

  await setDoc(
    docRef,
    {
      ...data,
      id,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
};
