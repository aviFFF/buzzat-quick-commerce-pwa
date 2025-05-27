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

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const recaptchaVerifierRef = useRef<any>(null)
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    // Initialize recaptcha when component mounts, only on client side, and after Firebase Auth is initialized
    if (
      typeof window !== "undefined" &&
      recaptchaContainerRef.current &&
      !recaptchaVerifierRef.current &&
      isAuthInitialized
    ) {
      const initRecaptcha = async () => {
        try {
          recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container")
          console.log("Recaptcha verifier initialized")
        } catch (error) {
          console.error("Error initializing recaptcha:", error)
          setError("Failed to initialize verification. Please try again.")
        }
      }

      initRecaptcha()
    }

    // Cleanup recaptcha when component unmounts
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch (error) {
          console.error("Error clearing recaptcha:", error)
        }
      }
    }
  }, [isAuthInitialized])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!recaptchaVerifierRef.current) {
        // Try to initialize recaptcha again if it's not initialized
        recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container")
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("Recaptcha not initialized")
      }

      const { success, confirmationResult, error } = await signInWithPhoneNumber(
        phoneNumber,
        recaptchaVerifierRef.current,
      )

      if (success && confirmationResult) {
        setVerificationId(confirmationResult.verificationId)
        setStep("otp")
      } else {
        setError((error as { message?: string })?.message || "Failed to send verification code. Please try again.")
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      setError(error?.message || "Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!verificationId) {
        throw new Error("Verification ID not found")
      }

      const { success, error } = await verifyOTP(verificationId, verificationCode)

      if (success) {
        // Close the modal
        onClose()
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout")
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout")
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            router.push("/checkout")
          }, 500)
        }
      } else {
        setError((error as { message?: string })?.message || "Invalid verification code. Please try again.")
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error)
      setError(error?.message || "Failed to verify code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
            <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
            <Button
              type="submit"
              className="w-full bg-gray-300 text-gray-800 hover:bg-gray-400"
              disabled={isLoading || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)}
            >
              {isLoading ? "Sending..." : "Continue"}
            </Button>
            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to our Terms of service & Privacy policy
            </p>
          </form>
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
