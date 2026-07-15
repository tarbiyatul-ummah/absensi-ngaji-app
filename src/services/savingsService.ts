import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SavingsAccount, SavingsPayment } from "../types";

export const getSavingsAccounts = async () => {
  const snapshot = await getDocs(collection(db, "savingsAccounts"));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SavingsAccount)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getSavingsAccountsByAcademicYear = async (
  academicYearStart: number,
) => {
  const q = query(
    collection(db, "savingsAccounts"),
    where("academicYearStart", "==", academicYearStart),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SavingsAccount)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const addSavingsAccount = async (
  data: Omit<SavingsAccount, "id" | "createdAt" | "updatedAt">,
) => {
  const timestamp = Date.now();
  const docRef = await addDoc(collection(db, "savingsAccounts"), {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const getSavingsPaymentId = (
  savingsAccountId: string,
  month: string,
  santriId: string,
) => `${savingsAccountId}_${month}_${santriId}`;

export const getSavingsPaymentsByAccount = async (
  savingsAccountId: string,
) => {
  const q = query(
    collection(db, "savingsPayments"),
    where("savingsAccountId", "==", savingsAccountId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as SavingsPayment);
};

export const saveSavingsPayment = async (
  data: Omit<SavingsPayment, "id" | "updatedAt">,
) => {
  const id = getSavingsPaymentId(
    data.savingsAccountId,
    data.month,
    data.santriId,
  );
  const docRef = doc(db, "savingsPayments", id);

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
