"use client"

import { getAuth, signInWithPhoneNumber as firebaseSignInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect } from "firebase/auth"
import { initializeFirebaseApp } from "./firebase-client"
import { isAuthInitialized } from "./firebase-client"
import { AUTH_CONFIG } from "./config"

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
    try {
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (isAuthInitialized) {
            clearInterval(checkInterval)
            resolve(true)
          }
        }, 100)
        
        // Set a timeout to avoid waiting indefinitely
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error("Auth initialization timeout"))
        }, 10000) // 10 seconds timeout
      })
    } catch (error) {
      console.error("Auth initialization timed out:", error)
      throw new Error("Firebase authentication service is unavailable. Please try again later.")
    }
  }

  try {
    if (!auth) {
      throw new Error("Auth is not initialized")
    }
    
    // Clean up any existing recaptcha verifiers
    const existingRecaptchas = document.querySelectorAll('.grecaptcha-badge');
    existingRecaptchas.forEach(element => {
      element.remove();
    });
    
    // Also remove any hidden recaptcha iframes
    const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
    iframes.forEach(element => {
      element.remove();
    });

    // Create a new RecaptchaVerifier instance
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        console.log("Recaptcha verified")
      },
      "expired-callback": () => {
        console.log("Recaptcha expired, refreshing...")
        // Force refresh the recaptcha
        if (verifier) {
          verifier.clear();
          verifier.render();
        }
      }
    })
    
    // Render the recaptcha to ensure it's ready
    await verifier.render()
    
    return verifier
  } catch (error) {
    console.error("Error initializing RecaptchaVerifier:", error)
    throw error
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    if (!auth) {
      console.error("Auth is not initialized")
      return { success: false, error: new Error("Auth is not initialized") }
    }

    // DEVELOPMENT WORKAROUND: Check if we're in development mode
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      console.log("Using development auth workaround - bypassing Firebase Google auth")
      
      // Create a mock user
      const mockUser = {
        uid: "dev-google-user-" + Date.now(),
        phoneNumber: null,
        displayName: "Dev User",
        email: "dev.user@example.com",
        photoURL: "https://via.placeholder.com/150",
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      }
      
      // Store the mock user in localStorage to simulate being signed in
      localStorage.setItem("dev-auth-user", JSON.stringify(mockUser))
      
      // Trigger a storage event to notify other tabs/components
      window.dispatchEvent(new Event("storage"))
      
      return { success: true, user: mockUser }
    }

    // PRODUCTION: Use actual Firebase authentication
    const provider = new GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Always prompt for account selection for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("Initiating Google sign-in...");
    
    // First try with redirect method instead of popup
    try {
      console.log("Attempting sign-in with redirect...");
      // Check if we're coming back from a redirect
      const result = await getRedirectResult(auth);
      
      if (result) {
        // User has been redirected back after authentication
        console.log("User returned from redirect flow:", result.user.displayName);
        return { 
          success: true, 
          user: result.user,
        };
      } else {
        // Start the redirect flow
        console.log("Starting redirect flow for authentication...");
        await signInWithRedirect(auth, provider);
        // This code won't execute as the page will redirect
        return { success: true };
      }
    } catch (redirectError) {
      console.error("Redirect sign-in failed, falling back to popup:", redirectError);
      
      // Fall back to popup method
      console.log("Trying popup method instead...");
      const result = await signInWithPopup(auth, provider);
      
      // Get the Google OAuth access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      
      console.log("User successfully authenticated with Google:", user.displayName);
      
      return { 
        success: true, 
        user: result.user,
        token: token
      }
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      return { 
        success: false, 
        error: new Error("Sign-in was cancelled. Please try again.")
      };
    } else if (error.code === 'auth/popup-blocked') {
      return { 
        success: false, 
        error: new Error("Sign-in popup was blocked by your browser. Please allow popups for this site or try again in a new tab.")
      };
    }
    
    return { success: false, error }
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

    // Check OTP limit in production
    if (!AUTH_CONFIG.ENABLE_PHONE_AUTH) {
      console.error("Phone authentication is disabled in configuration");
      return { 
        success: false, 
        error: new Error("Phone authentication is currently disabled. Please use Google Sign-In instead.")
      };
    }
    
    // Check daily OTP limit
    if (typeof window !== "undefined") {
      try {
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get stored usage data
        const storedData = localStorage.getItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY);
        let usageData = storedData ? JSON.parse(storedData) : { date: today, count: 0 };
        
        // Reset counter if it's a new day
        if (usageData.date !== today) {
          usageData = { date: today, count: 0 };
        }
        
        // Check if limit is reached
        if (usageData.count >= AUTH_CONFIG.DAILY_OTP_LIMIT) {
          console.log(`OTP daily limit of ${AUTH_CONFIG.DAILY_OTP_LIMIT} reached`);
          return { 
            success: false, 
            error: new Error(AUTH_CONFIG.OTP_LIMIT_MESSAGE)
          };
        }
        
        // Increment usage count
        usageData.count += 1;
        localStorage.setItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY, JSON.stringify(usageData));
        
        console.log(`OTP usage: ${usageData.count}/${AUTH_CONFIG.DAILY_OTP_LIMIT} for today`);
      } catch (error) {
        console.error("Error checking OTP limit:", error);
        // Continue even if there's an error with the limit checking
      }
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
