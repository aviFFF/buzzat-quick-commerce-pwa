"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useVendor } from "@/lib/context/vendor-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowRight, Package, ShoppingBag, DollarSign, Clock, AlertTriangle, TrendingUp, BarChart } from "lucide-react"
import { db } from "@/lib/firebase/config"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import Link from "next/link"
import dynamic from "next/dynamic"
import { notificationService } from "@/lib/firebase/notification-service"

// Dynamically import the PWA install button with no SSR
const PWAInstallButton = dynamic(() => import("@/components/pwa-install-button"), {
  ssr: false
})

interface Order {
  id: string
  orderNumber: string
  customerName: string
  total: number
  orderStatus: string
  createdAt: any
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
  productCount: number
  recentOrders: Order[]
  hasLoaded: boolean
}

export default function VendorDashboard() {
  const { vendor, isAuthenticated, isLoading } = useVendor()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    productCount: 0,
    recentOrders: [],
    hasLoaded: false
  })
  const [showNotificationDemo, setShowNotificationDemo] = useState(false)

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/vendor/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch dashboard data
  useEffect(() => {
    if (!vendor?.id) return

    const fetchDashboardData = async () => {
      try {
        // For test vendor in development
        if (process.env.NODE_ENV === 'development' && vendor.id === 'test-vendor-id') {
          setTimeout(() => {
            setStats({
              totalOrders: 52,
              totalRevenue: 7890,
              pendingOrders: 5,
              lowStockProducts: 3,
              productCount: 24,
              recentOrders: [
                {
                  id: 'test-order-1',
                  orderNumber: 'ORD12345',
                  customerName: 'John Doe',
                  total: 420,
                  orderStatus: 'pending',
                  createdAt: new Date()
                },
                {
                  id: 'test-order-2',
                  orderNumber: 'ORD12346',
                  customerName: 'Jane Smith',
                  total: 185,
                  orderStatus: 'confirmed',
                  createdAt: new Date(Date.now() - 3600000)
                },
                {
                  id: 'test-order-3',
                  orderNumber: 'ORD12347',
                  customerName: 'Mike Johnson',
                  total: 560,
                  orderStatus: 'delivered',
                  createdAt: new Date(Date.now() - 7200000)
                }
              ],
              hasLoaded: true
            })
          }, 1000)
          return
        }

        // Create date range for orders (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Fetch orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("vendorId", "==", vendor.id),
          where("createdAt", ">=", thirtyDaysAgo),
          orderBy("createdAt", "desc")
        )
        const ordersSnapshot = await getDocs(ordersQuery)
        
        // Fetch recent orders
        const recentOrdersQuery = query(
          collection(db, "orders"),
          where("vendorId", "==", vendor.id),
          orderBy("createdAt", "desc"),
          limit(5)
        )
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery)
        
        // Fetch products
        const productsQuery = query(
          collection(db, "products"),
          where("vendorId", "==", vendor.id)
        )
        const productsSnapshot = await getDocs(productsQuery)
        
        // Count products with low stock
        const lowStockProducts = productsSnapshot.docs.filter(doc => {
          const data = doc.data()
          return data.stock <= 5 // Consider low stock if 5 or fewer items
        }).length

        // Process order data
        const orders = ordersSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data
          }
        })
        
        // Process recent orders
        const recentOrders = recentOrdersSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            orderNumber: data.orderNumber,
            customerName: data.customerName,
            total: data.total,
            orderStatus: data.orderStatus,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Order
        })

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
        
        // Count pending orders
        const pendingOrders = orders.filter(order => 
          order.orderStatus === 'pending' || 
          order.orderStatus === 'confirmed' || 
          order.orderStatus === 'preparing'
        ).length

        setStats({
          totalOrders: ordersSnapshot.size,
          totalRevenue,
          pendingOrders,
          lowStockProducts,
          productCount: productsSnapshot.size,
          recentOrders,
          hasLoaded: true
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }

    fetchDashboardData()
  }, [vendor])

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check if we haven't asked for permission yet
      if (Notification.permission === 'default') {
        // Show notification demo after a delay
        const timer = setTimeout(() => {
          setShowNotificationDemo(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we load your vendor dashboard</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to access this page</p>
          <Button onClick={() => router.push("/vendor/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      {/* PWA Install Button */}
      <div className="fixed bottom-8 right-4 z-50">
        <PWAInstallButton 
          variant="default" 
          className="bg-green-500 hover:bg-green-600 shadow-lg"
          label="Install Vendor App" 
        />
      </div>
      
      <div className="mt-2 sm:mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back, {vendor.name}! Here's an overview of your store.
        </p>
      </div>

      {/* Notification permission prompt */}
      {showNotificationDemo && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enable Order Notifications</CardTitle>
            <CardDescription>
              Get instant alerts when new orders arrive, even when you're not looking at this screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="default" 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  notificationService.requestPermission();
                  setShowNotificationDemo(false);
                }}
              >
                Enable Notifications
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowNotificationDemo(false);
                }}
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards - 2 column on small mobile, 2 column on medium, 4 column on large */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold truncate">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/analytics" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center">
              View analytics <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/orders" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center">
              View all orders <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Need attention</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link 
              href="/vendor/orders?status=pending,confirmed,preparing" 
              className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center"
            >
              Process orders <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.lowStockProducts}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Out of {stats.productCount}</p>
          </CardContent>
          <CardFooter className="px-3 sm:px-6 pt-0">
            <Link href="/vendor/products?stock=low" className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center">
              Update inventory <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
            </div>

      {/* Main content cards - 1 column on mobile, 2 column on desktop */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your latest 5 orders
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {!stats.hasLoaded ? (
              <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading recent orders...</p>
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Orders will appear here once customers make purchases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-start sm:items-center justify-between border-b pb-2 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0 pr-2">
                      <Link 
                        href={`/vendor/orders/${order.id}`}
                        className="font-medium hover:underline line-clamp-1 text-sm sm:text-base"
                      >
                        #{order.orderNumber}
                      </Link>
                      <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {order.customerName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-sm sm:text-base">₹{order.total}</div>
                      <div className={`text-[10px] sm:text-xs ${
                        order.orderStatus === 'pending' ? 'text-amber-600' :
                        order.orderStatus === 'delivered' ? 'text-green-600' :
                        order.orderStatus === 'cancelled' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            )}
          </CardContent>
          <CardFooter className="px-4 sm:px-6">
            <Link href="/vendor/orders" className="text-xs sm:text-sm text-blue-600 hover:underline">
              View all orders
            </Link>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Common tasks to manage your store
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button className="h-auto py-3 sm:py-4 justify-start" variant="outline" asChild>
                <Link href="/vendor/products/add">
                  <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Add Product</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Create a new product</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-3 sm:py-4 justify-start" variant="outline" asChild>
                <Link href="/vendor/profile/pincodes">
                  <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Delivery Areas</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Manage pincodes</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-3 sm:py-4 justify-start" variant="outline" asChild>
                <Link href="/vendor/analytics">
                  <BarChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Analytics</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">View sales reports</div>
                  </div>
                </Link>
              </Button>
              
              <Button className="h-auto py-3 sm:py-4 justify-start" variant="outline" asChild>
                <Link href="/vendor/profile">
                  <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-base">Profile</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Update store info</div>
                  </div>
                </Link>
              </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
} 