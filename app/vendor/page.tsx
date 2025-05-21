"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useVendor } from "@/lib/context/vendor-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCookie } from "@/lib/firebase/set-session-cookie"

export default function VendorDashboard() {
  const { vendor, isAuthenticated, isLoading } = useVendor()
  const [cookies, setCookies] = useState<{ [key: string]: string | null }>({})
  const router = useRouter()

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/vendor/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Check cookies
  useEffect(() => {
    const cookieNames = ['session', 'testMode', 'sessionCreated', 'firebaseToken']
    const cookieValues: { [key: string]: string | null } = {}

    cookieNames.forEach(name => {
      cookieValues[name] = getCookie(name)
    })

    setCookies(cookieValues)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we load your vendor dashboard</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !vendor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to access this page</p>
          <Button onClick={() => router.push("/vendor/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Dashboard</CardTitle>
          <CardDescription>Welcome back, {vendor.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Your Vendor Details</h3>
              <p><strong>ID:</strong> {vendor.id}</p>
              <p><strong>Email:</strong> {vendor.email}</p>
              <p><strong>Phone:</strong> {vendor.phone}</p>
              <p><strong>Status:</strong> {vendor.status}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Session Information</h3>
              {Object.entries(cookies).map(([name, value]) => (
                <p key={name}>
                  <strong>{name}:</strong> {value || "(not set)"}
                </p>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={() => router.push("/vendor/auth-check")} variant="outline">
                Check Authentication Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 