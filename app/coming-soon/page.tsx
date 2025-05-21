"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { usePincode } from "@/lib/hooks/use-pincode"

export default function ComingSoonPage() {
  const router = useRouter()
  const { pincode } = usePincode()
  
  const handleBack = () => {
    // Go back to home page
    router.push("/")
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 p-4 rounded-full">
              <MapPin size={40} className="text-yellow-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">We're not in your area yet!</h1>
          
          <p className="text-gray-600 mb-6">
            We're sorry, but we don't currently deliver to pincode <span className="font-bold">{pincode}</span>. 
            We're working hard to expand our delivery areas.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mb-8">
            <p className="text-blue-700">
              Please check back later or try another pincode.
            </p>
          </div>
          
          <Button 
            onClick={handleBack} 
            className="flex items-center justify-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to home
          </Button>
        </div>
      </div>
    </main>
  )
} 