import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Get environment variables for Firebase configuration
const getFirebaseConfig = () => {
  // For client-side code, we need to access NEXT_PUBLIC_ variables
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
  
  return config
}

// Your web app's Firebase configuration
const firebaseConfig = getFirebaseConfig()

// Check if Firebase config is valid before initializing
const isConfigValid = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "" && 
         firebaseConfig.projectId && 
         firebaseConfig.projectId !== ""
}

// Print configuration status for debugging
if (typeof window !== 'undefined') {
  if (!isConfigValid()) {
    console.error(
      "Firebase configuration is invalid. Please check your environment variables or .env.local file. " +
      "You need to set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID, etc. Using test account only."
    )
  }
}

// Initialize Firebase
let app: any
let auth: any
let db: any
let storage: any

try {
  if (isConfigValid()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } else {
    throw new Error("Firebase configuration is invalid. Please check your environment variables.")
  }
} catch (error) {
  if (typeof window !== 'undefined') {
    console.error("Error initializing Firebase:", error)
    throw new Error("Failed to initialize Firebase. Check your configuration.")
  }
}

// Connect to emulators in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099')
//   connectFirestoreEmulator(db, 'localhost', 8080)
//   connectStorageEmulator(storage, 'localhost', 9199)
// }

export { app, auth, db, storage }
