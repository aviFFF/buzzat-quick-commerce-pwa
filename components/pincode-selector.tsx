"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable } from "@/lib/firebase/firestore"
import { useRouter } from "next/navigation"

export default function PincodeSelector() {
  const { pincode, updatePincode, isLoading } = usePincode()
  const [inputPincode, setInputPincode] = useState("")
  const [open, setOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()

  // Update input pincode when pincode changes
  useEffect(() => {
    if (pincode) {
      setInputPincode(pincode)
    }
  }, [pincode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPincode.length === 6 && /^\d+$/.test(inputPincode)) {
      setIsChecking(true)
      
      try {
        // Check if the pincode is serviceable
        const serviceable = await isPincodeServiceable(inputPincode)
        
        // Save pincode regardless of serviceability
        updatePincode(inputPincode)
        setOpen(false)
        
        if (serviceable) {
          // Reload the page to fetch new data based on updated pincode
          window.location.reload()
        } else {
          // Redirect to coming soon page if not serviceable
          router.push("/coming-soon")
        }
      } catch (error) {
        console.error("Error checking pincode serviceability:", error)
        // On error, update pincode and reload anyway
      updatePincode(inputPincode)
      setOpen(false)
        window.location.reload()
      } finally {
        setIsChecking(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="py-4">
        <Button variant="ghost" className="text-blue-600 p-0 h-auto font-normal" disabled>
          <MapPin size={16} className="mr-1" />
          <span>Loading...</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="py-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-blue-600 p-0 h-auto font-normal">
            <MapPin size={16} className="mr-1" />
            <span>Delivery to: </span>
            <span className="font-medium ml-1">{pincode}</span>
            <span className="font-medium ml-1 text-green-600">Change</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your delivery pincode</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit pincode"
              value={inputPincode}
              onChange={(e) => setInputPincode(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
            />
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600"
              disabled={inputPincode.length !== 6 || !/^\d+$/.test(inputPincode) || isChecking}
            >
              {isChecking ? "Checking..." : "Continue"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
