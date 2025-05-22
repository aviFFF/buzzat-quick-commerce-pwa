"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useVendor } from "@/lib/context/vendor-provider";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, User, MapPin, CreditCard } from "lucide-react";

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const ORDER_STATUS_SEQUENCE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered"
];

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: { [key: string]: string };
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: any;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderStatus: keyof typeof ORDER_STATUS_COLORS;
  notes?: string;
  paymentMethod: string;
  paymentStatus: string;
  vendorId: string;
}

export default function OrderDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { vendor } = useVendor();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;

  useEffect(() => {
    if (!vendor) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderDoc = await getDoc(doc(db, "orders", orderId));

        if (orderDoc.exists()) {
          const orderData = orderDoc.data() as Omit<Order, "id">;

          // Verify this order belongs to the vendor
          if (orderData.vendorId !== vendor.id) {
            console.error("This order does not belong to this vendor");
            router.push("/vendor/orders");
            return;
          }

          setOrder({ id: orderDoc.id, ...orderData } as Order);
        } else {
          console.error("Order not found");
          router.push("/vendor/orders");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, vendor, router]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || updating) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: newStatus
      });

      setOrder({
        ...order,
        orderStatus: newStatus as keyof typeof ORDER_STATUS_COLORS
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || updating) return;

    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        orderStatus: "cancelled"
      });

      setOrder({
        ...order,
        orderStatus: "cancelled"
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = () => {
    if (!order) return null;

    const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.orderStatus);

    if (currentIndex === -1 || currentIndex === ORDER_STATUS_SEQUENCE.length - 1) {
      return null;
    }

    return ORDER_STATUS_SEQUENCE[currentIndex + 1];
  };

  if (!vendor) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Order not found</p>
      </div>
    );
  }

  const formattedDate = order.createdAt?.toDate ?
    new Date(order.createdAt.toDate()).toLocaleString() :
    'Unknown date';

  const nextStatus = getNextStatus();

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
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        <Badge className={`${ORDER_STATUS_COLORS[order.orderStatus]} text-sm px-3 py-1 rounded-full`}>
          {ORDER_STATUS_LABELS[order.orderStatus]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} × ₹{item.price.toFixed(2)}
                      </div>
                      {item.options && Object.entries(item.options).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span key={key}>
                              {key}: {value}
                            </span>
                          )).reduce((prev, curr) => (
                            <>
                              {prev}, {curr}
                            </>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div>₹{order.subtotal.toFixed(2)}</div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Delivery Fee</div>
                  <div>₹{order.deliveryFee.toFixed(2)}</div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-medium">
                  <div>Total</div>
                  <div>₹{order.total.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">{order.customerName}</div>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">{order.customerPhone}</div>
                </div>
              </div>

              {order.customerAddress && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium">Delivery Address</div>
                    <div className="text-sm text-muted-foreground">{order.customerAddress}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <CreditCard className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                <div>
                  <div className="font-medium">Payment Method</div>
                  <div className="text-sm text-muted-foreground">
                    {order.paymentMethod} • <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="pt-2">
                  <div className="font-medium">Notes:</div>
                  <div className="text-sm text-muted-foreground">{order.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderStatus !== "cancelled" && nextStatus && (
                <Button 
                  className="w-full"
                  onClick={() => handleUpdateStatus(nextStatus)}
                  disabled={updating}
                >
                  Mark as {ORDER_STATUS_LABELS[nextStatus as keyof typeof ORDER_STATUS_LABELS]}
                </Button>
              )}
              
              {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelOrder}
                  disabled={updating}
                >
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 