"use client"

import { getAuth } from "./firebase-client"
import { isAuthInitialized } from "./firebase-client"

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
    const auth = getAuth()
    if (!auth) {
      throw new Error("Auth is not initialized")
    }

    const { RecaptchaVerifier } = await import("firebase/auth")

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
export const signInWithPhoneNumber = async (phoneNumber: string, recaptchaVerifier: any) => {
  if (typeof window === "undefined") {
    return { success: false, error: new Error("Can only be called on the client side") }
  }

  try {
    const auth = getAuth()
    if (!auth) {
      return { success: false, error: new Error("Auth is not initialized") }
    }

    const { signInWithPhoneNumber: firebaseSignInWithPhoneNumber } = await import("firebase/auth")

    const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`
    console.log("Signing in with phone number:", formattedPhoneNumber)

    const confirmationResult = await firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier)
    return { success: true, confirmationResult }
  } catch (error) {
    console.error("Error sending verification code:", error)
    return { success: false, error }
  }
}

// Verify OTP
export const verifyOTP = async (verificationId: string, otp: string) => {
  if (typeof window === "undefined") {
    return { success: false, error: new Error("Can only be called on the client side") }
  }

  try {
    const auth = getAuth()
    if (!auth) {
      return { success: false, error: new Error("Auth is not initialized") }
    }

    const { PhoneAuthProvider, signInWithCredential } = await import("firebase/auth")

    const credential = PhoneAuthProvider.credential(verificationId, otp)
    const userCredential = await signInWithCredential(auth, credential)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error }
  }
}

// Sign out
export const signOut = async () => {
  if (typeof window === "undefined") {
    return { success: false, error: new Error("Can only be called on the client side") }
  }

  try {
    const auth = getAuth()
    if (!auth) {
      return { success: false, error: new Error("Auth is not initialized") }
    }

    const { signOut: firebaseSignOut } = await import("firebase/auth")

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

  const auth = getAuth()
  if (!auth) {
    return null
  }

  return auth.currentUser
}

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  if (typeof window === "undefined") {
    console.log("Auth state listener can't be used server-side");
    return () => {}
  }

  const auth = getAuth();
  
  if (!auth) {
    console.warn("Auth is not initialized, cannot set up auth state listener");
    // For development mode, immediately call the callback with null
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Using dummy auth state handler");
      // Schedule callback execution to simulate auth state change
      setTimeout(() => callback(null), 0);
    }
    return () => {}
  }

  // Handle special case for development mode with dummy auth
  if (process.env.NODE_ENV === 'development' && 
      (!auth.onAuthStateChanged || typeof auth.onAuthStateChanged !== 'function')) {
    console.log("Development mode: Using dummy auth state handler");
    
    // If cookies indicate test mode, simulate a logged-in user
    const hasTestCookie = document.cookie.includes('testMode=true');
    if (hasTestCookie) {
      console.log("Test mode cookie found, simulating logged in user");
      // Simulate a logged-in test user with the test-vendor-id
      setTimeout(() => callback({ uid: 'test-vendor-id' }), 100);
    } else {
      // Simulate no user logged in
      setTimeout(() => callback(null), 100);
    }
    
    return () => {
      console.log("Cleanup dummy auth state listener");
    };
  }

  try {
    // Use dynamic import for better code splitting
    return import("firebase/auth")
      .then(({ onAuthStateChanged }) => {
        if (auth && typeof auth.onAuthStateChanged === 'function') {
          console.log("Setting up real auth state listener");
          return auth.onAuthStateChanged(callback);
        } else {
          console.warn("Auth object doesn't have onAuthStateChanged method");
          setTimeout(() => callback(null), 0);
          return () => {};
        }
      })
      .catch(error => {
        console.error("Error importing firebase/auth:", error);
        setTimeout(() => callback(null), 0);
        return () => {};
      });
  } catch (error) {
    console.error("Error setting up auth state listener:", error);
    setTimeout(() => callback(null), 0);
    return () => {};
  }
}
