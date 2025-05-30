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
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const router = useRouter()
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)

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
      const { success, error } = await signInWithGoogle();
      
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
        setError((error as { message?: string })?.message || "Failed to sign in with Google. Please try again.");
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error?.message || "Failed to sign in with Google. Please try again.");
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
                  disabled={isLoading}
                />
              </div>
              <div id="recaptcha-container" ref={recaptchaContainerRef} className="invisible h-0"></div>
              <Button
                type="submit"
                className="w-full bg-gray-300 text-gray-800 hover:bg-gray-400"
                disabled={isLoading || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)}
              >
                {isLoading ? "Sending..." : "Continue"}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{isGoogleLoading ? "Signing in..." : "Sign in with Google"}</span>
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, you agree to our Terms of service & Privacy policy
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
