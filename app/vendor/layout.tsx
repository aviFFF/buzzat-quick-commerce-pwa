"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Home, Package, Settings, ShoppingBag, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorProvider, useVendor } from "@/lib/context/vendor-provider"
import { Sidebar } from "@/components/vendor/sidebar"
import Spinner from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

// Redirect component that handles vendor authentication status
function VendorAuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, vendor } = useVendor()
  const pathname = usePathname()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Skip auth check for login and auth-check pages
  const isAuthPage = pathname === "/vendor/login" || pathname === "/vendor/auth-check"

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isLoading) {
      // If not authenticated and not on auth page, redirect to login
      if (!isAuthenticated && !isAuthPage) {
        console.log("Redirecting to login page")
        router.push("/vendor/login")
      }
      // If authenticated but not active status and not on auth check page
      else if (isAuthenticated && vendor && vendor.status !== "active" && pathname !== "/vendor/auth-check") {
        console.log(`Redirecting to auth check page. Vendor status: ${vendor.status}`)
        router.push("/vendor/auth-check")
      }
      // If on login page but already authenticated, redirect to dashboard
      else if (isAuthenticated && pathname === "/vendor/login") {
        console.log("Already authenticated, redirecting to dashboard")
        router.push("/vendor")
      }
    }
  }, [isAuthenticated, isLoading, isClient, pathname, router, vendor])

  // Show loading when auth state is being determined
  if (isLoading || !isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // For login page or auth check page, just render the page
  if (isAuthPage) {
    return <>{children}</>
  }

  // For protected pages, check if authenticated and active
  if (!isAuthenticated) {
    return null // Will redirect on mount
  }

  // If user is authenticated but not active, redirect to auth check
  if (vendor && vendor.status !== "active") {
    return null // Will redirect on mount
  }

  // Otherwise, render the protected children
  return <>{children}</>
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if it's the login page
  const isLoginPage = pathname === "/vendor/login"
  const isAuthCheckPage = pathname === "/vendor/auth-check"

  return (
    <VendorProvider>
      <VendorAuthRedirect>
        {isLoginPage || isAuthCheckPage ? (
          <main className="h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen flex-col">
            {/* Mobile Header with hamburger menu */}
            <header className="sticky top-0 z-40 border-b bg-background md:hidden">
              <div className="flex h-16 items-center px-4">
                <div className="flex items-center justify-between w-full">
                  <Link href="/vendor" className="font-semibold text-lg flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    <span>Vendor Portal</span>
                  </Link>
                  
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="pr-0 sm:max-w-xs">
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className="px-2">
                        <Sidebar onNavItemClick={() => setSidebarOpen(false)} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </header>
            
            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              {/* Desktop sidebar - hidden on mobile */}
              <aside className="fixed top-0 z-30 hidden h-screen w-[220px] border-r bg-background px-2 py-4 md:sticky md:block lg:w-[240px]">
                <Sidebar />
              </aside>
              
              <main className="relative flex-1 py-6 md:gap-10 md:py-8">
                {children}
              </main>
            </div>
          </div>
        )}
      </VendorAuthRedirect>
    </VendorProvider>
  )
} 