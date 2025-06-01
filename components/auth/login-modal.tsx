"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signInWithPhoneNumber, verifyOTP, initRecaptchaVerifier, signInWithGoogle } from "@/lib/firebase/auth"
import { useFirebase } from "@/lib/context/firebase-provider"
import { useRouter } from "next/navigation"
import { AUTH_CONFIG } from "@/lib/firebase/config"
import { useAuth } from "@/lib/context/auth-context"

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const recaptchaVerifierRef = useRef<any>(null)
  const { isAuthInitialized, isLoading: firebaseLoading, initializeAuth } = useFirebase()
  const router = useRouter()
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  const [otpCount, setOtpCount] = useState<number>(0);
  const [otpLimitReached, setOtpLimitReached] = useState<boolean>(false);
  const { refreshAuthState } = useAuth()

  // Cleanup any existing recaptcha elements when component mounts
  useEffect(() => {
    // Clear any existing recaptcha elements
    const existingRecaptchas = document.querySelectorAll('.grecaptcha-badge');
    existingRecaptchas.forEach(element => {
      element.remove();
    });
    
    // Also remove any hidden recaptcha iframes
    const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
    iframes.forEach(element => {
      element.remove();
    });
    
    return () => {
      // Cleanup when component unmounts
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.error("Error clearing recaptcha:", error);
        }
        recaptchaVerifierRef.current = null;
      }
      
      setRecaptchaInitialized(false);
    };
  }, []);

  // Initialize recaptcha when component mounts
  useEffect(() => {
    const initRecaptcha = async () => {
      if (
        typeof window !== "undefined" &&
        recaptchaContainerRef.current &&
        !recaptchaVerifierRef.current &&
        isAuthInitialized &&
        !recaptchaInitialized &&
        !firebaseLoading
      ) {
        try {
          console.log("Initializing recaptcha verifier...");
          recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container");
          setRecaptchaInitialized(true);
          console.log("Recaptcha verifier initialized successfully");
        } catch (error) {
          console.error("Error initializing recaptcha:", error);
          setError("Failed to initialize verification. Please try again or use Google login.");
        }
      }
    };

    // Try to initialize recaptcha after a short delay to ensure DOM is ready
    if (isAuthInitialized && !recaptchaInitialized && !firebaseLoading) {
      const timer = setTimeout(() => {
        initRecaptcha();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthInitialized, recaptchaInitialized, firebaseLoading]);

  // Check OTP usage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const today = new Date().toISOString().split('T')[0];
        const storedData = localStorage.getItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY);
        if (storedData) {
          const usageData = JSON.parse(storedData);
          if (usageData.date === today) {
            setOtpCount(usageData.count);
            setOtpLimitReached(usageData.count >= AUTH_CONFIG.DAILY_OTP_LIMIT);
          }
        }
      } catch (error) {
        console.error("Error checking OTP usage:", error);
      }
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!recaptchaVerifierRef.current || !recaptchaInitialized) {
        // Try to initialize recaptcha again if it's not initialized
        try {
          recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container");
          setRecaptchaInitialized(true);
        } catch (error) {
          throw new Error("Could not initialize recaptcha. Please refresh and try again.");
        }
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("Recaptcha not initialized");
      }

      const { success, confirmationResult, error } = await signInWithPhoneNumber(
        phoneNumber,
        recaptchaVerifierRef.current
      );

      if (success && confirmationResult) {
        setVerificationId(confirmationResult.verificationId);
        setStep("otp");
      } else {
        setError((error as { message?: string })?.message || "Failed to send verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setError(error?.message || "Failed to send verification code. Please try Google login instead.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!verificationId) {
        throw new Error("Verification ID not found");
      }

      const { success, error } = await verifyOTP(verificationId, verificationCode);

      if (success) {
        // Close the modal
        onClose();
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout");
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout");
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            router.push("/checkout");
          }, 500);
        }
      } else {
        setError((error as { message?: string })?.message || "Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setError(error?.message || "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      console.log("Attempting Google sign-in from login modal...");
      
      // Check if we're returning from a redirect
      if (typeof window !== 'undefined' && sessionStorage.getItem('auth_redirect_started') === 'true') {
        const redirectTimestamp = parseInt(sessionStorage.getItem('auth_redirect_timestamp') || '0');
        const currentTime = Date.now();
        const timeDifference = currentTime - redirectTimestamp;
        
        // If this is a fresh page load after redirect (within last 30 seconds)
        if (redirectTimestamp > 0 && timeDifference < 30000) {
          console.log("Detected return from auth redirect, clearing redirect flags");
          sessionStorage.removeItem('auth_redirect_started');
          sessionStorage.removeItem('auth_redirect_timestamp');
          
          // Close the modal after a short delay to allow auth state to update
          setTimeout(() => {
            refreshAuthState();
            onClose();
            router.refresh();
          }, 1000);
          
          return;
        } else {
          // Clear stale redirect data
          sessionStorage.removeItem('auth_redirect_started');
          sessionStorage.removeItem('auth_redirect_timestamp');
        }
      }
      
      // Check if Firebase is initialized
      if (!isAuthInitialized) {
        console.log("Firebase auth not initialized yet, attempting manual initialization...");
        // Try to manually initialize Firebase
        initializeAuth();
        
        // Wait a bit for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!isAuthInitialized) {
          console.error("Firebase auth still not initialized after manual attempt");
          throw new Error("Authentication service is not ready. Please try again in a moment.");
        }
      }
      
      console.log("Firebase initialization status before sign-in:", { isAuthInitialized, firebaseLoading });
      
      // Try Google sign-in
      const { success, error, user } = await signInWithGoogle();
      
      if (success) {
        console.log("Google sign-in successful, refreshing auth state");
        
        // Ensure auth state is refreshed
        refreshAuthState();
        
        // Close the modal
        onClose();
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout");
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout");
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            router.push("/checkout");
          }, 500);
        } else {
          // Force a refresh to update UI state
          router.refresh();
        }
      } else {
        console.error("Google sign-in failed:", error);
        setError((error as { message?: string })?.message || "Failed to sign in with Google. Please try again.");
      }
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      
      // Check for specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked' || error.message === "popup_blocked_by_browser") {
        setError("Sign-in popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection and try again.");
      } else if (error.code === 'auth/web-storage-unsupported') {
        setError("Authentication requires cookies and local storage to be enabled in your browser settings.");
      } else {
        setError(error?.message || "Failed to sign in with Google. Please try again.");
      }
      
      // If there's a serious initialization error, suggest phone auth instead
      if (error.message?.includes("not initialized") || error.message?.includes("not available")) {
        setError("Google sign-in is currently unavailable. Please try phone authentication instead.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Show loading state if Firebase is still initializing
  if (firebaseLoading || !isAuthInitialized) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/logo.webp" alt="Buzzat" width={60} height={60} className="mx-auto" />
          </div>
          <DialogTitle className="text-xl">
            {step === "phone" ? "India's last minute app" : "Enter verification code"}
          </DialogTitle>
          {step === "phone" && <p className="text-sm text-gray-500 mt-1">Log in or Sign up</p>}
          {step === "otp" && (
            <p className="text-sm text-gray-500 mt-1">We've sent a 6-digit code to +91 {phoneNumber}</p>
          )}
        </DialogHeader>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

        {step === "phone" ? (
          <>
            <Button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 mb-4"
              onClick={() => {
                console.log("Google sign-in button clicked");
                handleGoogleSignIn();
              }}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{isGoogleLoading ? "Signing in..." : "Sign in with Google"}</span>
            </Button>
            
            {otpLimitReached ? (
              <div className="bg-amber-50 text-amber-600 p-3 rounded-md text-sm mb-4">
                Daily OTP limit reached. Please use Google Sign-In instead.
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="flex">
                    <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                      <span className="text-gray-500">+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="rounded-l-none"
                      maxLength={10}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                      disabled={isLoading || otpLimitReached}
                    />
                  </div>
                  
                  {otpCount > 0 && otpCount < AUTH_CONFIG.DAILY_OTP_LIMIT && (
                    <div className="text-xs text-amber-600 text-center">
                      {AUTH_CONFIG.DAILY_OTP_LIMIT - otpCount} OTP verifications remaining today
                    </div>
                  )}
                  
                  <div id="recaptcha-container" ref={recaptchaContainerRef} className="invisible h-0"></div>
                  <Button
                    type="submit"
                    className="w-full bg-gray-300 text-gray-800 hover:bg-gray-400"
                    disabled={isLoading || otpLimitReached}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-800"></div>
                    ) : (
                      "Continue with Phone"
                    )}
                  </Button>
                </form>
              </>
            )}
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full bg-gray-300 text-gray-800 hover:bg-gray-400"
              disabled={isLoading || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setStep("phone")}
              disabled={isLoading}
            >
              Change phone number
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
