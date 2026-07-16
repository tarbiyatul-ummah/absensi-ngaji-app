import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import type {
  SavingsAccount,
  SavingsAccountFormData,
  SavingsPayment,
} from "../types";
import { db } from "./firebase";
import { userCollection, userDoc } from "./dataScope";

export const getSavingsAccounts = async () => {
  const snapshot = await getDocs(userCollection("savingsAccounts"));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SavingsAccount)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getSavingsAccountById = async (accountId: string) => {
  const snapshot = await getDoc(userDoc("savingsAccounts", accountId));
  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() } as SavingsAccount;
};

export const getSavingsAccountsByAcademicYear = async (
  academicYearStart: number,
) => {
  const q = query(
    userCollection("savingsAccounts"),
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
  const docRef = await addDoc(userCollection("savingsAccounts"), {
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
  await updateDoc(userDoc("savingsAccounts", accountId), {
    ...data,
    updatedAt: Date.now(),
  });
};

export const deleteSavingsAccount = async (accountId: string) => {
  const paymentsQuery = query(
    userCollection("savingsPayments"),
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

  await deleteDoc(userDoc("savingsAccounts", accountId));
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
    userCollection("savingsPayments"),
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
  const docRef = userDoc("savingsPayments", id);

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
