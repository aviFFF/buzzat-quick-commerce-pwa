"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { isFirebaseInitialized, isAuthInitialized } from "@/lib/firebase/firebase-client"

interface FirebaseContextType {
  isFirebaseInitialized: boolean
  isAuthInitialized: boolean
  isLoading: boolean
}

const FirebaseContext = createContext<FirebaseContextType>({
  isFirebaseInitialized: false,
  isAuthInitialized: false,
  isLoading: true,
})

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    isFirebaseInitialized: false,
    isAuthInitialized: false,
    isLoading: true,
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    // Check initialization status periodically
    const interval = setInterval(() => {
      setState({
        isFirebaseInitialized,
        isAuthInitialized,
        isLoading: false,
      })

      // Stop checking once both are initialized
      if (isFirebaseInitialized && isAuthInitialized) {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return <FirebaseContext.Provider value={state}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
