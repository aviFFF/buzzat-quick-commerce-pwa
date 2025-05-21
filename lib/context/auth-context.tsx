"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChange, signOut } from "@/lib/firebase/auth"
import { useFirebase } from "./firebase-provider"

interface User {
  uid: string
  phoneNumber: string | null
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<{ success: boolean; error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()

  useEffect(() => {
    // Only run auth state change listener on client side and after Firebase Auth is initialized
    if (typeof window !== "undefined" && isAuthInitialized && !firebaseLoading) {
      const unsubscribe = onAuthStateChange((authUser) => {
        if (authUser) {
          // User is signed in
          setUser({
            uid: authUser.uid,
            phoneNumber: authUser.phoneNumber,
            displayName: authUser.displayName,
            email: authUser.email,
            photoURL: authUser.photoURL,
          })
        } else {
          // User is signed out
          setUser(null)
        }
        setLoading(false)
      })

      // Cleanup subscription on unmount
      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      }
    } else if (!firebaseLoading) {
      // If Firebase is done loading but Auth is not initialized, or we're on the server, set loading to false
      setLoading(false)
    }
  }, [isAuthInitialized, firebaseLoading])

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
