/**
 * University of Sharjah - Firebase Initialization & Firestore Engine
 * Pure Vanilla ES Module (Loaded via Google CDN - Zero build tools required)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCgB73Pykh2qxDgkAbLx3McohLdMtkipfg",
  authDomain: "uos-digest.firebaseapp.com",
  projectId: "uos-digest",
  storageBucket: "uos-digest.firebasestorage.app",
  messagingSenderId: "1097427237826",
  appId: "1:1097427237826:web:9a303335bf14da6ee0b45b"
};

let app = null;
let db = null;
let storage = null;
let isFirebaseAvailable = false;
let isStorageAvailable = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseAvailable = true;
  isStorageAvailable = true;
  console.log("✓ Firebase Firestore & Storage initialized successfully for project:", firebaseConfig.projectId);
} catch (err) {
  console.warn("Firebase initialization warning (falling back to local cache):", err);
}

/**
 * Upload a PDF file directly to Firebase Cloud Storage
 * @param {File} file 
 * @param {Function} onProgress 
 * @returns {Promise<string>} public download URL
 */
export function uploadPdfToStorage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isStorageAvailable || !storage) {
      return reject(new Error("Firebase Storage is not available."));
    }

    const timer = setTimeout(() => {
      reject(new Error("Firebase Storage upload timed out. Ensure Firebase Storage is enabled in your Firebase Console."));
    }, 15000);

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `publications/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    const metadata = { contentType: 'application/pdf' };
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (typeof onProgress === 'function') onProgress(progress);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
      async () => {
        clearTimeout(timer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload an Image (Cover) file directly to Firebase Cloud Storage
 * @param {File} file 
 * @param {Function} onProgress 
 * @returns {Promise<string>} public download URL
 */
export function uploadImageToStorage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isStorageAvailable || !storage) {
      return reject(new Error("Firebase Storage is not available."));
    }

    const timer = setTimeout(() => {
      reject(new Error("Firebase Storage upload timed out. Ensure Firebase Storage is enabled in your Firebase Console."));
    }, 15000);

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `covers/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (typeof onProgress === 'function') onProgress(progress);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
      async () => {
        clearTimeout(timer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export { app, db, storage, isFirebaseAvailable, isStorageAvailable, doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, ref, uploadBytesResumable, getDownloadURL };

