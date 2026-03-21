import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// إعدادات مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA7qW5bjTPQA0q9XgKd6OHDzaNCDbtz2z0",
  authDomain: "firestore-1488a.firebaseapp.com",
  projectId: "firestore-1488a",
  storageBucket: "firestore-1488a.appspot.com", // الشكل الصحيح للتخزين
  messagingSenderId: "284773652304",
  appId: "1:284773652304:web:f379106224b0570b91fe55",
  measurementId: "G-FZJMJ7RPGT"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// Firestore لتخزين البيانات النصية
const db = getFirestore(app);

// Storage لتخزين الصور
const storage = getStorage(app);

export const auth = getAuth(app);
export { db, storage };
