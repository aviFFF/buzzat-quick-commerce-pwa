"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, User, MapPin, CreditCard } from "lucide-react"

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
}

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
}

const ORDER_STATUS_SEQUENCE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered"
]

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  options?: { [key: string]: string }
  image?: string
}

interface Order {
  id: string
  orderNumber: string
  createdAt: any
  customerName: string
  customerPhone: string
  customerAddress?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  orderStatus: keyof typeof ORDER_STATUS_COLORS
  notes?: string
  paymentMethod: string
  paymentStatus: string
  vendorId: string
}

export default function OrderDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { vendor } = useVendor()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!vendor) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const orderDoc = await getDoc(doc(db, "orders", params.id))

        if (orderDoc.exists()) {
          const orderData = orderDoc.data() as Omit<Order, "id">

          // Verify this order belongs to the vendor
          if (orderData.vendorId !== vendor.id) {
            console.error("This order does not belong to this vendor")
            router.push("/vendor/orders")
            return
          }

          setOrder({ id: orderDoc.id, ...orderData } as Order)
        } else {
          console.error("Order not found")
          router.push("/vendor/orders")
        }
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.id, vendor, router])

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || updating) return

    setUpdating(true)
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: newStatus
      })

      setOrder({
        ...order,
        orderStatus: newStatus as keyof typeof ORDER_STATUS_COLORS
      })
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order || updating) return

    if (!window.confirm("Are you sure you want to cancel this order?")) return

    setUpdating(true)
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: "cancelled"
      })

      setOrder({
        ...order,
        orderStatus: "cancelled"
      })
    } catch (error) {
      console.error("Error cancelling order:", error)
    } finally {
      setUpdating(false)
    }
  }

  const getNextStatus = () => {
    if (!order) return null

    const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus)

    if (currentIndex === -1 || currentIndex === ORDER_STATUS_SEQUENCE.length - 1) {
      return null
    }

    return ORDER_STATUS_SEQUENCE[currentIndex + 1]
  }

  if (!vendor) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Order not found</p>
      </div>
    )
  }

  const formattedDate = order.createdAt?.toDate ?
    new Date(order.createdAt.toDate()).toLocaleString() :
    'Unknown date'

  const nextStatus = getNextStatus()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber || order.id.slice(0, 6)}</h1>
          <p className="text-gray-500">{formattedDate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && nextStatus && (
            <Button
              onClick={() => handleUpdateStatus(nextStatus)}
              disabled={updating}
            >
              Mark as {ORDER_STATUS_LABELS[nextStatus as keyof typeof ORDER_STATUS_LABELS]}
            </Button>
          )}

          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updating}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Order Items</span>
                <Badge className={ORDER_STATUS_COLORS[order.orderStatus] || ""}>
                  {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between pb-4 border-b last:border-0">
                    <div className="flex gap-4">
                      {item.image && (
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                        {item.options && Object.entries(item.options).length > 0 && (
                          <div className="text-sm text-gray-500">
                            {Object.entries(item.options).map(([key, value]) => (
                              <span key={key}>{key}: {value}, </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>${order.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Customer</h3>
                    <p className="text-gray-600">{order.customerName || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-gray-600">{order.customerPhone || 'Not provided'}</p>
                  </div>
                </div>

                {order.customerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Delivery Address</h3>
                      <p className="text-gray-600">{order.customerAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Payment Method</h3>
                    <p className="text-gray-600">{order.paymentMethod || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Payment Status</h3>
                  <Badge variant={order.paymentStatus === "paid" ? "outline" : "destructive"} className={order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : ""}>
                    {order.paymentStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 