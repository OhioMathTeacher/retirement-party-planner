import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAHdateASYSNr6xpVYXR1dNn1wNvceFI5c",
  authDomain: "catherine-retirement.firebaseapp.com",
  projectId: "catherine-retirement",
  storageBucket: "catherine-retirement.firebasestorage.app",
  messagingSenderId: "850123579100",
  appId: "1:850123579100:web:edb358f3ce948fbe0ede19"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
