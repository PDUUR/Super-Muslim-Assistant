import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Config yang sudah Anda dapatkan dari Console
const firebaseConfig = {
    apiKey: "AIzaSyBXU_qfwhQnGdlmKdQYo0wr5gtjtXGO0oQ",
    authDomain: "super-muslim-assistant.firebaseapp.com",
    projectId: "super-muslim-assistant",
    storageBucket: "super-muslim-assistant.firebasestorage.app",
    messagingSenderId: "875205443229",
    appId: "1:875205443229:web:841721e05872b783435e74",
    measurementId: "G-5XTNGDK4MG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (Bagus untuk tracking!)
const analytics = getAnalytics(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// WAJIB: Aktifkan Offline Persistence (Anti-Lemot saat sinyal buruk)
// Ini akan menyimpan data di cache browser (IndexedDB)
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence failed: Browser not supported');
        }
    });

export { auth, db, analytics };
