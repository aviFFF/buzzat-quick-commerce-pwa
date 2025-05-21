"use client"

import { usePathname } from "next/navigation"
import { BarChart3, Home, LogOut, Package, Settings, ShoppingBag, User, MapPin, Grid } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useVendor } from "@/lib/context/vendor-provider"
import { Button } from "../ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SidebarNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function SidebarNavItem({ href, icon, label }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
        isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

export function Sidebar() {
  const { logout } = useVendor()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      router.push("/vendor/login")
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full py-4 space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Vendor Dashboard</h2>
        <div className="space-y-1">
          <SidebarNavItem
            href="/vendor"
            icon={<Home className="h-4 w-4" />}
            label="Dashboard"
          />
          <SidebarNavItem
            href="/vendor/products"
            icon={<Package className="h-4 w-4" />}
            label="Products"
          />
          <SidebarNavItem
            href="/vendor/categories"
            icon={<Grid className="h-4 w-4" />}
            label="Categories"
          />
          <SidebarNavItem
            href="/vendor/orders"
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Orders"
          />
          <SidebarNavItem
            href="/vendor/profile"
            icon={<User className="h-4 w-4" />}
            label="Profile"
          />
          <SidebarNavItem
            href="/vendor/profile/pincodes"
            icon={<MapPin className="h-4 w-4" />}
            label="Delivery Areas"
          />
          <SidebarNavItem
            href="/vendor/analytics"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
          />
          <SidebarNavItem
            href="/vendor/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </div>
      </div>
      <div className="px-3 py-2 mt-auto">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
} 