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
    if (typeof window !== "undefined") {
      // Check for development mode mock user
      const checkDevUser = () => {
        if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
          const devUser = localStorage.getItem("dev-auth-user")
          if (devUser) {
            try {
              const mockUser = JSON.parse(devUser)
              setUser(mockUser)
              return true
            } catch (e) {
              console.error("Error parsing dev user:", e)
            }
          }
        }
        return false
      }

      // If we have a dev user, use that
      const hasDevUser = checkDevUser()
      
      if (!hasDevUser && isAuthInitialized && !firebaseLoading) {
        // Use Firebase auth in production or if no dev user
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
    }
  }, [isAuthInitialized, firebaseLoading])

  // Add an effect to check for development mode user changes
  useEffect(() => {
    // Check for development mode user in localStorage
    if (typeof window !== "undefined" && 
        (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true")) {
      
      // Function to check for dev user
      const checkDevUser = () => {
        const devUser = localStorage.getItem("dev-auth-user")
        if (devUser) {
          try {
            const mockUser = JSON.parse(devUser)
            setUser(mockUser)
          } catch (e) {
            console.error("Error parsing dev user:", e)
          }
        } else {
          // If no dev user in localStorage, set user to null
          setUser(null)
        }
        setLoading(false)
      }
      
      // Check immediately
      checkDevUser()
      
      // Also set up a storage event listener to detect changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "dev-auth-user") {
          checkDevUser()
        }
      }
      
      window.addEventListener("storage", handleStorageChange)
      
      // Clean up
      return () => {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [])

  // Custom signOut function that handles both Firebase and dev mode
  const handleSignOut = async () => {
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      // In development, just remove the dev user from localStorage
      localStorage.removeItem("dev-auth-user")
      setUser(null)
      return { success: true }
    } else {
      // In production, use Firebase signOut
      return signOut()
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
