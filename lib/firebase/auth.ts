"use client"

import { getAuth, signInWithPhoneNumber as firebaseSignInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, signOut as firebaseSignOut } from "firebase/auth"
import { initializeFirebaseApp } from "./firebase-client"
import { isAuthInitialized } from "./firebase-client"

// Get auth instance
const app = initializeFirebaseApp()
const auth = app ? getAuth(app) : null

// Initialize recaptcha verifier
export const initRecaptchaVerifier = async (containerId: string) => {
  if (typeof window === "undefined") {
    throw new Error("RecaptchaVerifier can only be initialized on the client side")
  }

  // Wait for Auth to be initialized
  if (!isAuthInitialized) {
    console.log("Waiting for Auth to initialize before creating RecaptchaVerifier...")
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isAuthInitialized) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)
    })
  }

  try {
    if (!auth) {
      throw new Error("Auth is not initialized")
    }

    return new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        console.log("Recaptcha verified")
      },
    })
  } catch (error) {
    console.error("Error initializing RecaptchaVerifier:", error)
    throw error
  }
}

// Sign in with phone number
export async function signInWithPhoneNumber(phoneNumber: string, recaptchaVerifier: any) {
  try {
    // Format phone number with country code
    const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`
    console.log("Signing in with phone number:", formattedPhoneNumber)

    // DEVELOPMENT WORKAROUND: Check if we're in development mode
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      console.log("Using development auth workaround - bypassing Firebase phone auth")
      
      // Create a mock confirmation result
      const mockVerificationId = "mock-verification-id-" + Date.now()
      const mockConfirmationResult = {
        verificationId: mockVerificationId,
        confirm: async (code: string) => {
          // Accept any 6-digit code in development
          if (code.length === 6 && /^\d+$/.test(code)) {
            // Create a mock user credential
            return {
              user: {
                uid: "dev-user-" + Date.now(),
                phoneNumber: formattedPhoneNumber,
                displayName: null,
                email: null,
                photoURL: null,
                isAnonymous: false,
                metadata: {
                  creationTime: new Date().toISOString(),
                  lastSignInTime: new Date().toISOString()
                }
              }
            }
          } else {
            throw new Error("Invalid verification code")
          }
        }
      }
      
      return { success: true, confirmationResult: mockConfirmationResult }
    }

    // PRODUCTION: Use actual Firebase authentication
    console.log("Using real Firebase phone authentication")
    if (!auth) {
      console.error("Auth is not initialized")
      return { success: false, error: new Error("Auth is not initialized") }
    }

    const confirmationResult = await firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier)
    return { success: true, confirmationResult }
  } catch (error) {
    console.error("Error sending verification code:", error)
    return { success: false, error }
  }
}

// Verify OTP
export async function verifyOTP(verificationId: string, verificationCode: string) {
  try {
    console.log("Verifying code for verification ID:", verificationId)
    
    // DEVELOPMENT WORKAROUND: Check if we're using the mock verification
    if (verificationId.startsWith("mock-verification-id-")) {
      console.log("Using development auth workaround for verification")
      
      // Accept any 6-digit code in development
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        // Create a mock user and sign in
        const mockUser = {
          uid: "dev-user-" + Date.now(),
          phoneNumber: "+91" + Math.floor(1000000000 + Math.random() * 9000000000),
          displayName: null,
          email: null,
          photoURL: null
        }
        
        console.log("Development mode: Creating mock user", mockUser)
        
        // Store the mock user in localStorage to simulate being signed in
        localStorage.setItem("dev-auth-user", JSON.stringify(mockUser))
        
        // Trigger a storage event to notify other tabs/components
        window.dispatchEvent(new Event("storage"))
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout")
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout")
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            window.location.href = "/checkout"
          }, 500)
        }
        
        return { success: true }
      } else {
        console.error("Invalid verification code format")
        throw new Error("Invalid verification code")
      }
    }

    // PRODUCTION: Use actual Firebase verification
    console.log("Using real Firebase verification")
    if (!auth) {
      console.error("Auth is not initialized")
      return { success: false, error: new Error("Auth is not initialized") }
    }

    const credential = PhoneAuthProvider.credential(verificationId, verificationCode)
    await signInWithCredential(auth, credential)
    console.log("User successfully authenticated with phone number")
    return { success: true }
  } catch (error) {
    console.error("Error verifying code:", error)
    return { success: false, error }
  }
}

// Sign out
export const signOut = async () => {
  try {
    if (!auth) {
      return { success: false, error: new Error("Auth is not initialized") }
    }

    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error }
  }
}

// Get current user
export const getCurrentUser = () => {
  if (typeof window === "undefined") {
    return null
  }

  if (!auth) {
    return null
  }

  return auth.currentUser
}

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  // Check if we're in development mode with a mock user
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
    const devUser = localStorage.getItem("dev-auth-user")
    if (devUser) {
      try {
        const mockUser = JSON.parse(devUser)
        // Call callback with mock user
        setTimeout(() => callback(mockUser), 0)
        
        // Return a dummy unsubscribe function
    return () => {}
      } catch (e) {
        console.error("Error parsing dev user:", e)
      }
    }
  }

  // If no mock user or not in development, use Firebase auth
  const { onAuthStateChanged } = require("firebase/auth")
  return onAuthStateChanged(auth, callback)
}
