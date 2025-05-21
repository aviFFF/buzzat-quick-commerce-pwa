"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, query, where, Firestore } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ShoppingBag, Users, BarChart3 } from "lucide-react"

interface DashboardStats {
  totalVendors: number
  activeVendors: number
  totalProducts: number
  totalOrders: number
  pendingOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendors: 0,
    activeVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setError(null)

      // Verify Firebase connection
      if (!db) {
        throw new Error("Firebase is not initialized")
      }

      // Fetch vendors stats
      const vendorsSnapshot = await getDocs(collection(db as Firestore, "vendors"))
      const vendors = vendorsSnapshot.docs.map(doc => doc.data())

      // Fetch products stats
      const productsSnapshot = await getDocs(collection(db as Firestore, "products"))

      // Fetch orders stats
      const ordersSnapshot = await getDocs(collection(db as Firestore, "orders"))
      const orders = ordersSnapshot.docs.map(doc => doc.data())

      setStats({
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.status === "active").length,
        totalProducts: productsSnapshot.size,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === "pending").length,
      })
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error)
      setError(error.message || "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={fetchDashboardStats}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to your admin dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-gray-500">
              {stats.activeVendors} active vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500">
              Products across all vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500">
              {stats.pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <p className="text-xs text-gray-500">
              Detailed analytics and reports
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/vendors">
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Vendors
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No recent activity to show</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 