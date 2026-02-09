// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Your web app's Firebase configuration
// Note: It is safe to expose these credentials in client-side code.
// Security is handled by Firebase Security Rules, which restrict access based on user authentication
// and data validation logic, not by keeping these keys secret.
const firebaseConfig = {
    apiKey: "AIzaSyBev5rA4KOvicOza3tZ3Wa4N2pS_MV4tdo",
    authDomain: "thompsoncoins-4c541.firebaseapp.com",
    projectId: "thompsoncoins-4c541",
    storageBucket: "thompsoncoins-4c541.firebasestorage.app",
    messagingSenderId: "436932824345",
    appId: "1:436932824345:web:0444d5d9a519d6f6834988",
    measurementId: "G-1GDYCH2ZS9"
};

let app, analytics, db, storage;

try {
    // Initialize Firebase
    console.log('Initializing Firebase from centralized config...');
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);

    // Fix storage bucket name and initialization
    try {
        storage = getStorage(app);
        // Test storage connection
        // console.log('Testing storage connection...');
        // const testRef = ref(storage, 'test.txt');
        // console.log('Storage reference created:', testRef);
    } catch (storageError) {
        console.error('Error with storage:', storageError);
        // Try alternative storage bucket format
        const altConfig = { ...firebaseConfig, storageBucket: "thompsoncoins-6544f.firebaseapp.com" };
        const altApp = initializeApp(altConfig, "altApp");
        storage = getStorage(altApp);
        console.log('Using alternative storage configuration');
    }

    // Make Firebase instances available globally for backward compatibility if needed, 
    // but prefer importing from this file
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseStorage = storage;

    console.log('Firebase initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

export { app, analytics, db, storage };
