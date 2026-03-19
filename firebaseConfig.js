// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7qW5bjTPQA0q9XgKd6OHDzaNCDbtz2z0",
  authDomain: "firestore-1488a.firebaseapp.com",
  databaseURL: "https://firestore-1488a-default-rtdb.firebaseio.com",
  projectId: "firestore-1488a",
  storageBucket: "firestore-1488a.firebasestorage.app",
  messagingSenderId: "284773652304",
  appId: "1:284773652304:web:f379106224b0570b91fe55",
  measurementId: "G-FZJMJ7RPGT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
