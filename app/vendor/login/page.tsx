"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendor } from "@/lib/context/vendor-provider"
import { AlertCircle, Info, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { setVendorSessionCookies } from "@/lib/firebase/set-session-cookie"
import LoginDebug from "./debug"

export default function VendorLogin() {
  const { login, isLoading, isAuthenticated, vendor } = useVendor()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Check if already logged in and redirect
  useEffect(() => {
    if (isAuthenticated && vendor) {
      console.log("Already authenticated, setting session cookies");

      // Set session cookies with the vendor's ID
      setVendorSessionCookies(
        vendor.uid || vendor.id // Use UID if available, otherwise ID
      );

      // Delay redirect slightly to ensure cookies are set
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        router.push("/vendor");
      }, 100);
    }
  }, [isAuthenticated, vendor, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    let loginSuccessful = false;

    try {
      console.log("Logging in with email:", email)
      
      // Check Firebase configuration in production
      if (process.env.NODE_ENV === 'production') {
        console.log("Production environment detected. Checking Firebase config...");
        const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                 !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        console.log("Firebase config available:", hasFirebaseConfig);
      }
      
      const result = await login(email, password)
      loginSuccessful = result.success;

      if (result.success) {
        console.log("Login successful");

        // For real accounts, wait for vendor state to update and check multiple times
        let attempts = 0;
        const maxAttempts = 8;
        const checkInterval = 250;

        const checkVendorData = () => {
          attempts++;
          console.log(`Checking vendor data (attempt ${attempts}/${maxAttempts})...`);
          console.log("Current vendor state:", vendor ? `ID: ${vendor.id || vendor.uid}` : "No vendor data");

          if (vendor && (vendor.id || vendor.uid)) {
            // We have vendor data with an ID
            const vendorId = vendor.uid || vendor.id;
            console.log("Vendor data available. Setting session cookies with ID:", vendorId);

            // Set session cookies and redirect
            setVendorSessionCookies(vendorId, false);
            
            // Use direct window.location for more reliable redirect in production
            if (process.env.NODE_ENV === 'production') {
              window.location.href = "/vendor";
            } else {
              router.push("/vendor");
            }
          } else if (attempts < maxAttempts) {
            // Try again after a short delay
            setTimeout(checkVendorData, checkInterval);
          } else {
            // Give up after max attempts
            console.error("No vendor ID available after maximum attempts");
            
            // In production, try one last fallback approach
            if (process.env.NODE_ENV === 'production') {
              console.log("Attempting fallback authentication approach...");
              // Try to get current user directly from Firebase Auth
              const auth = require('firebase/auth').getAuth();
              if (auth && auth.currentUser) {
                const uid = auth.currentUser.uid;
                console.log("Found authenticated user with UID:", uid);
                setVendorSessionCookies(uid, false);
                window.location.href = "/vendor";
                return;
              }
            }
            
            setError("Authentication error: Could not retrieve vendor details. Please try again or contact support.");
            setIsSubmitting(false);
          }
        };

        // Start checking for vendor data
        checkVendorData();
      } else if (result.error) {
        console.error("Login failed:", result.error)

        // Set specific error message for inactive vendors
        if (result.error.message.includes("not active") ||
          result.error.message.includes("pending") ||
          result.error.message.includes("blocked")) {
          setError("Your vendor account is not active. Please contact the admin for approval.")
        } else if (result.error.message.includes("Firebase") || 
                  result.error.message.includes("configuration")) {
          setError("Login service is currently unavailable. Please try again later or contact support.")
        } else {
          setError(result.error.message)
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login. Please try again.")
    } finally {
      if (!loginSuccessful) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Vendor Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="mb-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Admin Approval Required</AlertTitle>
            <AlertDescription>
              Only vendors that have been approved by an admin can login.
              If you're having trouble logging in, please contact support.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}