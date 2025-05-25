import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAP3Sy1PB0m_EpKifOpUd7tc1_eAKF2alM",
  authDomain: "vimbalambi-news.firebaseapp.com",
  databaseURL: "https://vimbalambi-news-default-rtdb.firebaseio.com",
  projectId: "vimbalambi-news",
  storageBucket: "vimbalambi-news.appspot.com",
  messagingSenderId: "212254517932",
  appId: "1:212254517932:web:d061c943f90b4c4e204d09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  } catch (error) {
    // Emulators already connected
  }
}

export default app;
