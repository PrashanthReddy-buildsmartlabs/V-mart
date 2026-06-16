import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9jXwJDGz6IXey8Ml32y8nQyAhOKNrRC8",
  authDomain: "buildsmartlabs-c3083.firebaseapp.com",
  projectId: "buildsmartlabs-c3083",
  storageBucket: "buildsmartlabs-c3083.firebasestorage.app",
  messagingSenderId: "346626995578",
  appId: "1:346626995578:web:179c66ad745402107f92c3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
