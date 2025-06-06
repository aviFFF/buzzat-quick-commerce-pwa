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
import { shouldShowHeaderFooter } from "@/lib/utils"

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
  generator: 'buzzat'
}

export const viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // We'll rely on client-side detection for header/footer visibility
  // Server-side will show them by default, then client-side JS will adjust
  const showHeaderFooter = true;

  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body className={`${fontClass} min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="flex-grow">
              {children}
            </div>
            <div id="layout-footer-container" style={{display: 'block'}}>
              <Footer data-footer="true" />
            <div id="layout-footer-container" style={{display: 'block'}}>
              <Footer data-footer="true" />
                <div className="block sm:hidden">
                <BottomNav key="bottom-nav" data-bottom-nav="true" />
              </div>
              <PincodeRequiredModal data-pincode-modal="true" />
                <BottomNav key="bottom-nav" data-bottom-nav="true" />
              </div>
              <PincodeRequiredModal data-pincode-modal="true" />
                </div>
          </Providers>
          <Toaster />
        </ThemeProvider>
        <Script src="/service-worker-register.js" strategy="lazyOnload" />
        {/* Script to update header/footer visibility on client side */}
        <Script id="update-layout" strategy="afterInteractive">
          {`
            function updateLayoutVisibility() {
              const pathname = window.location.pathname;
              console.log("Checking layout visibility for path:", pathname);
              
              // Add appropriate class to body based on URL
              if (pathname.includes('/admin')) {
                document.body.classList.add('admin-page');
                document.body.classList.remove('vendor-page');
              } else if (pathname.includes('/vendor')) {
                document.body.classList.add('vendor-page');
                document.body.classList.remove('admin-page');
              } else {
                document.body.classList.remove('admin-page');
                document.body.classList.remove('vendor-page');
              }
              
              // Check for admin or vendor pages first
              if (pathname.includes('/admin') || pathname.includes('/vendor')) {
                hideElements();
                return;
              }
              
              // List of other paths that should NOT have header and footer
              const noHeaderFooterPaths = ['/checkout', '/auth', '/payment-success', '/payment-failure'];
              const shouldShow = !noHeaderFooterPaths.some(path => pathname.startsWith(path));
                            
              // Find footer and bottom nav elements
              const footer = document.querySelector('[data-footer="true"]');
              const bottomNav = document.querySelector('[data-bottom-nav="true"]');
              const pincodeModal = document.querySelector('[data-pincode-modal="true"]');
              
              // Update visibility
              if (footer) footer.style.display = shouldShow ? '' : 'none';
              if (bottomNav) bottomNav.style.display = shouldShow ? '' : 'none';
              if (pincodeModal) pincodeModal.style.display = shouldShow ? '' : 'none';
            }
            
            function hideElements() {
              const footer = document.querySelector('[data-footer="true"]');
              const bottomNav = document.querySelector('[data-bottom-nav="true"]');
              const pincodeModal = document.querySelector('[data-pincode-modal="true"]');
              
              if (footer) footer.style.display = 'none';
              if (bottomNav) bottomNav.style.display = 'none';
              if (pincodeModal) pincodeModal.style.display = 'none';
            }
            
            // Immediate check on script load - hide footer container if on admin/vendor pages
            (function() {
              const pathname = window.location.pathname;
              if (pathname.includes('/admin')) {
                document.body.classList.add('admin-page');
              } else if (pathname.includes('/vendor')) {
                document.body.classList.add('vendor-page');
            }
              
              if (pathname.includes('/admin') || pathname.includes('/vendor')) {
                const container = document.getElementById('layout-footer-container');
                if (container) {
                  container.style.display = 'none';
                }
              }
            })();
            
            // Run on initial load
            updateLayoutVisibility();
            
            // Listen for URL changes
            window.addEventListener('popstate', updateLayoutVisibility);
            
            // For Next.js client-side navigation
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function() {
              originalPushState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            history.replaceState = function() {
              originalReplaceState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            // Also check periodically in case we miss any navigation events
            setInterval(updateLayoutVisibility, 1000);
              
              if (pathname.includes('/admin') || pathname.includes('/vendor')) {
                const container = document.getElementById('layout-footer-container');
                if (container) {
                  container.style.display = 'none';
                }
              }
            })();
            
            // Run on initial load
            updateLayoutVisibility();
            
            // Listen for URL changes
            window.addEventListener('popstate', updateLayoutVisibility);
            
            // For Next.js client-side navigation
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function() {
              originalPushState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            history.replaceState = function() {
              originalReplaceState.apply(this, arguments);
              updateLayoutVisibility();
            };
            
            // Also check periodically in case we miss any navigation events
            setInterval(updateLayoutVisibility, 1000);
          `}
        </Script>
      </body>
    </html>
  )
}
