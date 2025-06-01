import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if all required Firebase config variables are set
const isFirebaseConfigValid = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Log a warning if Firebase config is missing
if (typeof window !== 'undefined' && !isFirebaseConfigValid()) {
  console.error(
    "Firebase configuration is incomplete. Please check your environment variables.",
    {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  );
}

// Authentication configuration
export const AUTH_CONFIG = {
  // Phone authentication settings
  ENABLE_PHONE_AUTH: true,
  DAILY_OTP_LIMIT: 5,
  OTP_USAGE_STORAGE_KEY: 'otp_usage',
  OTP_LIMIT_MESSAGE: 'Daily OTP limit reached. Please use Google Sign-In instead.',
  
  // Google authentication settings
  ENABLE_GOOGLE_AUTH: true,
  
  // Debug settings
  DEBUG_AUTH: process.env.NODE_ENV === 'development',
}

// Export Firebase config for use in other files
export const getFirebaseConfig = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
};

// Initialize Firebase
let app: any
let auth: any
let db: any
let storage: any

try {
  if (isFirebaseConfigValid()) {
    app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp()
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
