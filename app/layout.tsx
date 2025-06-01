import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import BottomNav from "@/components/bottom-nav"
import Footer from "@/components/footer"
import Script from "next/script"
import PincodeRequiredModal from "@/components/pincode-required-modal"
// Import environment variables setup
import "@/lib/env"

// Remove Google font dependency
const fontClass = "font-sans"

export const metadata: Metadata = {
  title: "Buzzat - Quick Commerce Delivery",
  description: "Get groceries and essentials delivered in minutes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buzzat",
  },
  generator: 'v0.dev'
}

export const viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if the current path is admin or vendor
  const isAdminOrVendor = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/admin') || 
     window.location.pathname.startsWith('/vendor'));

  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body className={`${fontClass} min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="flex-grow">
              {children}
            </div>
            {!isAdminOrVendor && (
              <>
                <Footer />
                <div className="block sm:hidden">
                  <BottomNav key="bottom-nav" />
                </div>
              </>
            )}
            <PincodeRequiredModal />
          </Providers>
          <Toaster />
        </ThemeProvider>
        <Script src="/service-worker-register.js" strategy="lazyOnload" />
        {/* Script to detect admin/vendor paths on client side */}
        <Script id="detect-admin-vendor" strategy="afterInteractive">
          {`
            function updateBodyClass() {
              const isAdminOrVendor = window.location.pathname.startsWith('/admin') || 
                                      window.location.pathname.startsWith('/vendor');
              document.body.classList.toggle('admin-vendor-page', isAdminOrVendor);
            }
            updateBodyClass();
            window.addEventListener('popstate', updateBodyClass);
          `}
        </Script>
      </body>
    </html>
  )
}
