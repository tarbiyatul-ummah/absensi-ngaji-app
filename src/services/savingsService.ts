import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SavingsAccount } from "../types";

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
