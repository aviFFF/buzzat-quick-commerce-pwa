"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signInWithPhoneNumber, verifyOTP, initRecaptchaVerifier } from "@/lib/firebase/auth"
import { useFirebase } from "@/lib/context/firebase-provider"
import { useRouter } from "next/navigation"
import { AUTH_CONFIG } from "@/lib/firebase/config"
import { useAuth } from "@/lib/context/auth-context"

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [isLoading, setIsLoading] = useState(false)
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
          recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container");
          setRecaptchaInitialized(true);
        } catch (error: any) {
          console.error("Error initializing recaptcha:", error);
          setError("Failed to initialize verification. Please try again.");
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
        } catch (error: any) {
          console.error("Error reinitializing recaptcha:", error);
          throw new Error("Could not initialize verification. Please refresh and try again.");
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
        
        // Update OTP usage count
        try {
          const today = new Date().toISOString().split('T')[0];
          const newCount = otpCount + 1;
          setOtpCount(newCount);
          setOtpLimitReached(newCount >= AUTH_CONFIG.DAILY_OTP_LIMIT);
          
          localStorage.setItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY, JSON.stringify({
            date: today,
            count: newCount
          }));
        } catch (e) {
          console.error("Failed to update OTP usage count:", e);
        }
      } else {
        setError((error as { message?: string })?.message || "Failed to send verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setError(error?.message || "Failed to send verification code. Please try again.");
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
        } else {
          refreshAuthState();
          router.refresh();
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
            {otpLimitReached ? (
              <div className="bg-amber-50 text-amber-600 p-3 rounded-md text-sm mb-4">
                Daily OTP limit reached. Please try again tomorrow.
              </div>
            ) : (
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
                
                <div id="recaptcha-container" ref={recaptchaContainerRef} className="h-[80px] flex justify-center"></div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading || otpLimitReached}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    "Continue with Phone"
                  )}
                </Button>
              </form>
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
              className="w-full bg-green-600 text-white hover:bg-green-700"
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
