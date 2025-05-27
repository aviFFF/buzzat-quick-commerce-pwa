"use client"

import { useState, useEffect } from "react"

// Default pincode to use if none is stored
const DEFAULT_PINCODE = "332211"

export const usePincode = () => {
  const [pincode, setPincode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Load pincode from localStorage on client side
  useEffect(() => {
    const storedPincode = localStorage.getItem("pincode")
    setPincode(storedPincode || DEFAULT_PINCODE)
    setIsLoading(false)
    
    // Listen for pincode changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pincode") {
        setPincode(e.newValue || DEFAULT_PINCODE)
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Save pincode to localStorage when it changes
  const updatePincode = (newPincode: string) => {
    // Don't update if it's the same pincode
    if (newPincode === pincode) return;
    
    // Update state
    setPincode(newPincode)
    
    // Save to localStorage
    localStorage.setItem("pincode", newPincode)
    
    // Manually dispatch storage event to notify other tabs/components
    // This helps with components in the same tab that are listening for storage events
    try {
      const storageEvent = new StorageEvent("storage", {
        key: "pincode",
        newValue: newPincode,
        oldValue: pincode,
        storageArea: localStorage,
      });
      window.dispatchEvent(storageEvent);
    } catch (e) {
      // Fallback for browsers that don't support StorageEvent constructor
      // Just dispatch a custom event
      const event = new CustomEvent("pincodeChange", { 
        detail: { newPincode, oldPincode: pincode } 
      });
      window.dispatchEvent(event);
    }
  }

  return {
    pincode,
    updatePincode,
    isLoading
  }
} 