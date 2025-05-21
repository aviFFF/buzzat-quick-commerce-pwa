"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useVendor } from "@/lib/context/vendor-provider"
import { AlertCircle, Info, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DirectTestLogin from "./direct-test-login"
import { setVendorSessionCookies } from "@/lib/firebase/set-session-cookie"
import LoginDebug from "./debug"

export default function VendorLogin() {
  const { login, isLoading, isAuthenticated, vendor } = useVendor()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showDevHelp, setShowDevHelp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Check if already logged in and redirect
  useEffect(() => {
    if (isAuthenticated && vendor) {
      console.log("Already authenticated, setting session cookies");

      // Set session cookies with the vendor's ID
      setVendorSessionCookies(
        vendor.uid || vendor.id, // Use UID if available, otherwise ID
        process.env.NODE_ENV === 'development' &&
        (vendor.email === 'test@example.com' || vendor.id === 'test-vendor-id')
      );

      // Delay redirect slightly to ensure cookies are set
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        router.push("/vendor");
      }, 100);
    }
  }, [isAuthenticated, vendor, router]);

  // Check if we're in development mode without Firebase configuration
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'

    if (isDev) {
      console.log("Running in development mode")
      const hasMissingEnvVars =
        !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

      setShowDevHelp(hasMissingEnvVars)

      if (hasMissingEnvVars) {
        console.log("Firebase configuration missing. Using test account is enabled.")

        // Pre-fill test credentials in development mode for easier testing
        setEmail("test@example.com")
        setPassword("password")
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    let loginSuccessful = false;

    try {
      console.log("Logging in with email:", email)
      const result = await login(email, password)
      loginSuccessful = result.success;

      if (result.success) {
        console.log("Login successful");

        // For test account in development, use hardcoded values
        if (process.env.NODE_ENV === 'development' && email === 'test@example.com') {
          const testVendorId = 'test-vendor-id';
          console.log("Setting test account session cookies with ID:", testVendorId);
          setVendorSessionCookies(testVendorId, true);
          router.push("/vendor");
          return;
        }

        // For real accounts, wait for vendor state to update and check multiple times
        let attempts = 0;
        const maxAttempts = 5;
        const checkInterval = 200; // ms

        const checkVendorData = () => {
          attempts++;
          console.log(`Checking vendor data (attempt ${attempts}/${maxAttempts})...`);

          if (vendor && (vendor.id || vendor.uid)) {
            // We have vendor data with an ID
            const vendorId = vendor.uid || vendor.id;
            console.log("Vendor data available. Setting session cookies with ID:", vendorId);

            // Set session cookies and redirect
            setVendorSessionCookies(
              vendorId,
              process.env.NODE_ENV === 'development' && vendor.email === 'test@example.com'
            );
            router.push("/vendor");
          } else if (attempts < maxAttempts) {
            // Try again after a short delay
            setTimeout(checkVendorData, checkInterval);
          } else {
            // Give up after max attempts
            console.error("No vendor ID available after maximum attempts");
            setError("Authentication error: Could not retrieve vendor details");
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

  // Use the test credentials automatically in development mode
  const useTestCredentials = () => {
    setEmail("test@example.com")
    setPassword("password")
  }

  // Direct login handler for test account
  const handleTestLogin = () => {
    console.log("Using direct test account login");
    setEmail("test@example.com");
    setPassword("password");

    // Set session cookies for test account
    setVendorSessionCookies('test-vendor-id', true);

    // Attempt immediate redirection
    if (typeof window !== 'undefined') {
      window.location.href = "/vendor";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Vendor Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your vendor dashboard
          </CardDescription>
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

          {showDevHelp && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Development Mode</AlertTitle>
              <AlertDescription>
                <p>Firebase configuration is missing or invalid.</p>
                <p className="mt-2">Test credentials have been pre-filled for you:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Email: test@example.com</li>
                  <li>Password: password</li>
                </ul>
                <p className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestLogin}
                    className="mt-1"
                  >
                    Login with Test Account
                  </Button>
                </p>
                <p className="mt-2 text-xs">To configure Firebase, create a .env.local file in the project root with your Firebase credentials.</p>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Emergency bypass for development mode */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <DirectTestLogin />
              <LoginDebug />
            </>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          <p className="w-full">
            Your vendor account must be created and approved by an administrator before you can log in.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 