"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import Cookies from "js-cookie"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')

  // Check if the user is already logged in
  useEffect(() => {
    const session = Cookies.get("admin_session")
    if (session) {
      router.push("/admin")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Get Firebase auth instance
      const auth = getAuth()

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!db) {
        throw new Error("Firebase Firestore is not initialized")
      }

      // Check if user has admin role in Firestore
      const userDoc = await getDoc(doc(db as Firestore, "admins", user.uid))

      if (!userDoc.exists()) {
        // User exists but not as admin
        await auth.signOut()
        setError("You don't have admin privileges.")
        setLoading(false)
        return
      }

      // Set admin session cookie
      Cookies.set("admin_session", "true", {
        expires: 7, // 7 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      })

      // Redirect to the originally requested page or default to admin dashboard
      if (redirectPath) {
        router.push(decodeURIComponent(redirectPath))
      } else {
        router.push("/admin")
      }
    } catch (error: any) {
      console.error("Admin login error:", error)

      // Handle different types of Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password")
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many login attempts. Please try again later.")
      } else {
        setError(error.message || "Failed to login")
      }

      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm text-gray-500">
            For admin access only. Contact support if you need assistance.
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 