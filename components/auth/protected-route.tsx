"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { useFirebase } from "@/lib/context/firebase-provider"
import LoadingAnimation from "@/components/loading-animation"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Only run after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're in a loading state
  const loading = !mounted || firebaseLoading || authLoading || !isAuthInitialized

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/")
    }
  }, [user, loading, router, mounted])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingAnimation />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
