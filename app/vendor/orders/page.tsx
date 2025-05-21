"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { useVendor } from "@/lib/context/vendor-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

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

interface Order {
  id: string
  createdAt: any
  orderNumber: string
  customerName: string
  customerPhone: string
  items: any[]
  total: number
  orderStatus: keyof typeof ORDER_STATUS_COLORS
  paymentMethod: string
  paymentStatus: string
  [key: string]: any
}

export default function VendorOrders() {
  const router = useRouter()
  const { vendor } = useVendor()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    if (!vendor) return

    setLoading(true)

    // Create a query for orders with the vendor's ID
    const ordersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", vendor.id),
      orderBy("createdAt", "desc")
    )

    // Set up a snapshot listener
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Order[]

        setOrders(ordersData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching orders:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [vendor])

  const handleOrderClick = (orderId: string) => {
    router.push(`/vendor/orders/${orderId}`)
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(order => order.orderStatus === filterStatus)

  if (!vendor) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-500">Manage your store orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const formattedDate = order.createdAt?.toDate ?
                      new Date(order.createdAt.toDate()).toLocaleDateString() :
                      'Unknown date'

                    return (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOrderClick(order.id)}>
                        <TableCell className="font-medium">{order.orderNumber || '-'}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{order.customerName || '-'}</TableCell>
                        <TableCell>{order.items?.length || 0}</TableCell>
                        <TableCell>${order.total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge className={ORDER_STATUS_COLORS[order.orderStatus] || ""}>
                            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === "paid" ? "outline" : "destructive"} className={order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : ""}>
                            {order.paymentStatus || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrderClick(order.id)
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 