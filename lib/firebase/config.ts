import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check for environment variables and provide fallbacks for development
const getEnvOrFallback = (key: string, fallback: string = "") => {
  const value = process.env[key]
  if (!value && process.env.NODE_ENV === "development") {
    console.warn(`Missing environment variable: ${key}, using fallback value`)
    
    // Default development fallback values for Firebase config
    const devFallbacks: Record<string, string> = {
      NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key-for-development",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:abcdefghijklmnop",
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ABCDEFGHIJ",
    }
    
    return devFallbacks[key] || fallback
  }
  return value || ""
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: getEnvOrFallback("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
}

// Check if Firebase config is valid before initializing
const isConfigValid = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "" && 
         firebaseConfig.projectId && 
         firebaseConfig.projectId !== ""
}

// Print configuration status for debugging
if (process.env.NODE_ENV === 'development') {
  if (isConfigValid()) {
    console.log("Firebase configuration is valid (using " + 
      (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "real" : "fallback") + 
      " credentials)");
  } else {
    console.error(
      "Firebase configuration is invalid. Please check your environment variables or .env.local file. " +
      "You need to set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID, etc. Using test account only."
    )
  }
}

// Initialize Firebase only if config is valid
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
    console.log("Firebase initialized successfully")
  } else {
    console.warn("Firebase not initialized due to invalid configuration. Test account will work in development mode.")
    // Create dummy objects to prevent runtime errors
    app = null
    auth = { currentUser: null }
    db = { collection: () => ({}) }
    storage = {}
  }
} catch (error) {
  console.error("Error initializing Firebase:", error)
  // Create dummy objects to prevent runtime errors
  app = null
  auth = { currentUser: null }
  db = { collection: () => ({}) }
  storage = {}
}

// Connect to emulators in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099')
//   connectFirestoreEmulator(db, 'localhost', 8080)
//   connectStorageEmulator(storage, 'localhost', 9199)
// }

export { app, auth, db, storage }
