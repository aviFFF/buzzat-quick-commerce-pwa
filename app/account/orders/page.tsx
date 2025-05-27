"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useAuth } from "@/lib/context/auth-context"
import { LoginModal } from "@/components/auth/login-modal"
import { Clock, Package, Check } from "lucide-react"

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Sample orders data - in a real app, this would come from your backend
  const orders = [
    {
      id: "ORD123456",
      date: "2023-06-15",
      total: 350.50,
      status: "Delivered",
      items: [
        { name: "Fresh Apples", quantity: 2, price: 120 },
        { name: "Organic Milk", quantity: 1, price: 80 },
        { name: "Whole Wheat Bread", quantity: 1, price: 45 }
      ]
    },
    {
      id: "ORD123457",
      date: "2023-06-10",
      total: 520.75,
      status: "Delivered",
      items: [
        { name: "Chicken Breast", quantity: 1, price: 220 },
        { name: "Rice (5kg)", quantity: 1, price: 250 },
        { name: "Mixed Vegetables", quantity: 1, price: 50.75 }
      ]
    }
  ]
  
  // Redirect if not logged in
  useEffect(() => {
    setMounted(true)
    
    if (mounted && !loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading, mounted])
  
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
              <p className="text-lg mb-4">Please log in to view your orders</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
              >
                Login
              </button>
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <button 
              onClick={() => router.push('/category')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center border-b pb-3 mb-3">
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center">
                    {order.status === "Delivered" ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <Check size={16} className="mr-1" />
                        Delivered
                      </span>
                    ) : (
                      <span className="flex items-center text-blue-600 text-sm">
                        <Clock size={16} className="mr-1" />
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">₹{order.total.toFixed(2)}</span>
                </div>
                
                <div className="mt-3">
                  <button className="text-emerald-600 text-sm font-medium">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
} 