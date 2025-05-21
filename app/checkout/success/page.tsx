"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { getOrderById } from "@/lib/firebase/firestore"
import ProtectedRoute from "@/components/auth/protected-route"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [orderNumber, setOrderNumber] = useState<string>("")

  useEffect(() => {
    if (orderId) {
      // Format order ID for display
      setOrderNumber(orderId.slice(0, 8).toUpperCase())

      // Fetch order details if needed
      const fetchOrder = async () => {
        try {
          const order = await getOrderById(orderId)
          // You could use order details here if needed
        } catch (error) {
          console.error("Error fetching order:", error)
        }
      }

      fetchOrder()
    }
  }, [orderId])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm text-center">
            <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your order. We've received your order and will begin processing it soon.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Order Number:</span>
                <span className="font-medium">#{orderNumber || "QM12345"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Delivery:</span>
                <span className="font-medium">30-60 minutes</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                <Link href="/">Continue Shopping</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/account/orders">Track Order</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
