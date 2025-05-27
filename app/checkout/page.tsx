"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, CreditCard } from "lucide-react"
import Image from "next/image"
import BannerCardsDisplay from "@/components/banner-cards-display"
import { LoginModal } from "@/components/auth/login-modal"

export default function CheckoutPage() {
  const { cartItems, cartCount } = useCart()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Redirect to home if cart is empty or user is not logged in
  useEffect(() => {
    setMounted(true)
    
    if (mounted && !loading) {
      if (!user) {
        // Show login modal instead of redirecting
        setShowLoginModal(true)
      } else if (cartCount === 0) {
        router.push('/')
      }
    }
  }, [user, cartCount, loading, mounted, router])
  
  if (!mounted || loading) {
  return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
            </div>
      </main>
    )
  }

  // If user is not logged in, show login modal
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg mb-4">Please log in to proceed with checkout</p>
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal 
            onClose={() => {
              setShowLoginModal(false);
              // If still not logged in after closing modal, redirect to home
              if (!user) {
                router.push('/');
              }
            }} 
          />
        )}
      </main>
    )
  }

  // If cart is empty, redirect to home
  if (cartCount === 0) {
    router.push('/');
    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = 40
  const total = subtotal + deliveryFee
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Cart items */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Your Items</h2>
              
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center py-3 border-b last:border-0">
                  <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.image} 
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-500 text-sm">{item.unit}</p>
                    <div className="flex justify-between mt-1">
                      <span className="font-semibold">₹{item.price.toFixed(2)}</span>
                      <span className="text-gray-500">Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
              <div className="flex items-start">
                <MapPin className="text-emerald-500 mr-2 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Home</p>
                  <p className="text-gray-500 text-sm">123 Main Street, Apartment 4B</p>
                  <p className="text-gray-500 text-sm">New Delhi, 110001</p>
                </div>
              </div>
              <Button variant="outline" className="mt-3 text-sm h-8">Change Address</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Delivery Time</h2>
              <div className="flex items-center">
                <Clock className="text-emerald-500 mr-2 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Express Delivery</p>
                  <p className="text-gray-500 text-sm">Delivery within 30-45 minutes</p>
                </div>
              </div>
        </div>
      </div>

          {/* Right column - Order summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
        </div>
      </div>

              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <div className="flex items-start">
                  <CreditCard className="text-emerald-500 mr-2 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-gray-500 text-sm">Cash on Delivery</p>
        </div>
      </div>
    </div>
              
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                Place Order
              </Button>
            </div>
        </div>
        </div>
        
        {/* Bottom banner */}
        <div className="mt-8">
          <BannerCardsDisplay position="bottom" />
        </div>
      </div>
    </main>
  )
}
