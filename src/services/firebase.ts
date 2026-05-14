// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBb13os-x7PiBtyPv9ximA4xhNbk0ZUoZI",
  authDomain: "absensi-ngaji-fc52b.firebaseapp.com",
  projectId: "absensi-ngaji-fc52b",
  storageBucket: "absensi-ngaji-fc52b.firebasestorage.app",
  messagingSenderId: "61290308479",
  appId: "1:61290308479:web:8c22fbd2fe7ba6b8bc304a",
  measurementId: "G-SE3FHLMYGM",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      auth,
      (user) => {
        removeListener(); // Hapus listener segera setelah dapet data
        resolve(user);
      },
      reject,
    );
  });
};
