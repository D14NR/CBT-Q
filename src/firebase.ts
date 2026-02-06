import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9QnVDqr70BFxWyq7K-gpIGsaxqnNAWUE",
  authDomain: "cbt-q-5bb3b.firebaseapp.com",
  projectId: "cbt-q-5bb3b",
  storageBucket: "cbt-q-5bb3b.firebasestorage.app",
  messagingSenderId: "160068385403",
  appId: "1:160068385403:web:5be9e90a9ce996b41c40de",
  measurementId: "G-3BET2RTL39"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
