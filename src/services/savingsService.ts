import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  SavingsAccount,
  SavingsAccountFormData,
  SavingsPayment,
} from "../types";

export const getSavingsAccounts = async () => {
  const snapshot = await getDocs(collection(db, "savingsAccounts"));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SavingsAccount)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getSavingsAccountById = async (accountId: string) => {
  const snapshot = await getDoc(doc(db, "savingsAccounts", accountId));
  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() } as SavingsAccount;
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
  data: SavingsAccountFormData,
) => {
  const timestamp = Date.now();
  const docRef = await addDoc(collection(db, "savingsAccounts"), {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const updateSavingsAccount = async (
  accountId: string,
  data: SavingsAccountFormData,
) => {
  await updateDoc(doc(db, "savingsAccounts", accountId), {
    ...data,
    updatedAt: Date.now(),
  });
};

export const deleteSavingsAccount = async (accountId: string) => {
  const paymentsQuery = query(
    collection(db, "savingsPayments"),
    where("savingsAccountId", "==", accountId),
  );
  const paymentsSnapshot = await getDocs(paymentsQuery);
  const chunkSize = 450;

  for (let index = 0; index < paymentsSnapshot.docs.length; index += chunkSize) {
    const batch = writeBatch(db);
    const chunk = paymentsSnapshot.docs.slice(index, index + chunkSize);

    chunk.forEach((paymentDoc) => {
      batch.delete(paymentDoc.ref);
    });
    await batch.commit();
  }

  await deleteDoc(doc(db, "savingsAccounts", accountId));
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
