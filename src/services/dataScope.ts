import { collection, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const getCurrentUserId = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User belum login.");
  }

  return user.uid;
};

export const userCollection = (collectionName: string) =>
  collection(db, "users", getCurrentUserId(), collectionName);

export const userDoc = (collectionName: string, documentId: string) =>
  doc(db, "users", getCurrentUserId(), collectionName, documentId);
