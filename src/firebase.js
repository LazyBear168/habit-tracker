// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDu8-YtAkMIDroSztLGGFIpdGXpUWvkzcQ",
  authDomain: "habits-up.firebaseapp.com",
  projectId: "habits-up",
  storageBucket: "habits-up.firebasestorage.app",
  messagingSenderId: "446450514113",
  appId: "1:446450514113:web:847796f2824d928aad3c40",
  measurementId: "G-0JSTR7ZKPG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

