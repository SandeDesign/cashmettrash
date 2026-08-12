import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config from environment variables
// Note: Firebase API keys are safe to be public (protected by Security Rules)
// But using env vars is best practice for flexibility across environments
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBpbHMjDkStia7SZnRf85ZSjVNIhx6BIeA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vlottr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vlottr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vlottr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "245476426806",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:245476426806:web:c54a2933300786c8be0497"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;