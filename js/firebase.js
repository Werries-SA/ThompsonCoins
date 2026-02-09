// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { db, storage } from "./firebaseConfig.js";

// Firebase configuration is not needed here as it's initialized in index.html
// We'll use the global instances that are defined there

// Function to upload coin image to Firebase Storage
async function uploadCoinImage(file) {
  const storageRef = ref(storage, `coins/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

// Function to add a coin to Firestore
async function addCoin(coinData) {
  try {
    const docRef = await addDoc(collection(db, "coins"), coinData);
    console.log("Coin added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding coin: ", error);
    throw error;
  }
}

// Function to get all coins from Firestore
async function getCoins() {
  try {
    const q = query(collection(db, "coins"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const coins = [];

    querySnapshot.forEach((doc) => {
      coins.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return coins;
  } catch (error) {
    console.error("Error getting coins: ", error);
    throw error;
  }
}

export { uploadCoinImage, addCoin, getCoins }; 