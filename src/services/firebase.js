import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDCw_TbyE7IPKX6CzEkX_S9-zhm5h6KQ0M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ofis-project-230f8.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://ofis-project-230f8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ofis-project-230f8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ofis-project-230f8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "364723530499",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:364723530499:web:69c60bfdd5941fe45e9736",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0JM8CC0WRB"
};

// Initialize or get app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const database = getDatabase(app);
export const firestore = null; // OFIC uses Firebase Realtime Database
export const storage = getStorage(app);
export default app;
