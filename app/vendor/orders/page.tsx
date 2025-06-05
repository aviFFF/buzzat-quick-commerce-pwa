"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore"
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
import { Bell } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import OrderNotification from "@/components/vendor/order-notification"
import { notificationService } from "@/lib/firebase/notification-service"

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

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string
  createdAt: Timestamp
  userId: string
  items: OrderItem[]
  totalAmount: number
  deliveryFee: number
  address: {
    name: string
    phone: string
    address: string
    pincode: string
    city: string
  }
  paymentMethod: "cod" | "online"
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: keyof typeof ORDER_STATUS_COLORS
  updatedAt?: Timestamp
  deliveryPersonId?: string
}

export default function VendorOrders() {
  const router = useRouter()
  const { vendor } = useVendor()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendor || !vendor.pincodes || vendor.pincodes.length === 0) return

    setLoading(true)
    setError(null)
    
    // Get orders that match the vendor's pincodes
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    )

    // Set up a snapshot listener
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        try {
          // Filter orders client-side based on pincode
          const ordersData = snapshot.docs
            .map(doc => {
              try {
                const data = doc.data();
                const docId = doc.id;
                
                // Create a safe order object with defaults for missing values
                return {
                  id: docId,
                  createdAt: data.createdAt || Timestamp.now(),
                  userId: data.userId || "",
                  items: Array.isArray(data.items) ? data.items.map(item => ({
                    productId: item.productId || "",
                    name: item.name || "Unknown Product",
                    price: typeof item.price === 'number' ? item.price : 0,
                    quantity: typeof item.quantity === 'number' ? item.quantity : 1
                  })) : [],
                  totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
                  deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
                  address: {
                    name: data.address?.name || "Unknown",
                    phone: data.address?.phone || "",
                    address: data.address?.address || "",
                    pincode: data.address?.pincode || "",
                    city: data.address?.city || ""
                  },
                  paymentMethod: data.paymentMethod || "cod",
                  paymentStatus: data.paymentStatus || "pending",
                  orderStatus: data.orderStatus || "pending"
                } as Order;
              } catch (err) {
                console.error("Error processing order document:", err, doc.id);
                return null;
              }
            })
            .filter(order => order !== null) // Remove any orders that failed to process
            .filter(order => {
              // Check if order's pincode matches any of the vendor's pincodes
              const orderPincode = order?.address?.pincode;
              const vendorPincodes = vendor.pincodes || [];
              return orderPincode && vendorPincodes.includes(orderPincode);
            }) as Order[];

          // Check for new orders in the last 5 minutes
          const fiveMinutesAgo = new Date();
          fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
          
          const newOrders = ordersData.filter(order => {
            if (!order.createdAt) return false;
            try {
              const orderDate = order.createdAt.toDate();
              return orderDate > fiveMinutesAgo && order.orderStatus === 'pending';
            } catch (err) {
              console.error("Error converting timestamp:", err);
              return false;
            }
          });

          // Show notification for new orders
          if (newOrders.length > 0 && newOrders.length !== newOrdersCount) {
            // Only show notification if the count changed
            if (newOrdersCount > 0) {
              const newOrderCount = newOrders.length - newOrdersCount;
              
              // Show toast notification
              toast({
                title: `${newOrderCount} New Order(s)!`,
                description: "You have new orders that need attention.",
                variant: "default",
                duration: 5000,
              });
              
              // Show browser notification and play sound
              if (newOrderCount > 0) {
                // Get the newest order
                const newestOrder = newOrders[0];
                const orderNumber = newestOrder.id.slice(0, 8).toUpperCase();
                
                // Show notification
                notificationService.showNewOrderNotification(
                  newestOrder.id,
                  orderNumber
                );
              }
            }
            setNewOrdersCount(newOrders.length);
          }

          setOrders(ordersData);
          setLoading(false);
        } catch (error) {
          console.error("Error processing orders:", error);
          setError("Failed to process orders data. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please check your connection and refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendor, toast, newOrdersCount]);

  const handleOrderClick = (orderId: string) => {
    router.push(`/vendor/orders/${orderId}`)
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(order => order.orderStatus === filterStatus)

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading vendor information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-500">Manage orders for your delivery areas</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderNotification 
            newOrdersCount={newOrdersCount}
            onClick={() => setFilterStatus('pending')}
          />
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

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order List</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing orders for pincodes: {(vendor.pincodes || []).join(', ')}
          </div>
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
                    let formattedDate = 'Unknown date';
                    try {
                      if (order.createdAt?.toDate) {
                        formattedDate = new Date(order.createdAt.toDate()).toLocaleDateString();
                      }
                    } catch (err) {
                      console.error("Error formatting date:", err);
                    }

                    return (
                      <TableRow 
                        key={order.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${order.orderStatus === 'pending' ? 'bg-yellow-50' : ''}`}
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <TableCell className="font-medium">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{order.address?.name || 'Unknown'}</TableCell>
                        <TableCell>{Array.isArray(order.items) ? order.items.length : 0} items</TableCell>
                        <TableCell>₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'} px-2 py-1`}>
                            {ORDER_STATUS_LABELS[order.orderStatus] || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === "paid" ? "outline" : "secondary"}>
                            {order.paymentMethod === "cod" ? "COD" : "Online"} • 
                            {order.paymentStatus === "paid" ? " Paid" : " Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order.id);
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