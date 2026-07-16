import {
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { SppPayment } from "../types";
import { userCollection, userDoc } from "./dataScope";

export const getSppPaymentId = (
  academicYearStart: number,
  month: string,
  santriId: string,
) => `${academicYearStart}_${month}_${santriId}`;

export const getSppPaymentsByAcademicYear = async (
  academicYearStart: number,
) => {
  const q = query(
    userCollection("sppPayments"),
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
  const docRef = userDoc("sppPayments", id);

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
