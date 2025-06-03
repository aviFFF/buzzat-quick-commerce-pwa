import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the current path is an admin or vendor page
 * @param pathname The current pathname
 * @returns boolean indicating if the current page is an admin or vendor page
 */
export function isAdminOrVendorPage(pathname?: string): boolean {
  if (typeof window !== 'undefined' && !pathname) {
    pathname = window.location.pathname;
  }
  
  return !!pathname && (pathname.startsWith('/admin/login') || pathname.startsWith('/vendor/login'));
}

/**
 * Check if the current page should display header and footer
 * @param pathname The current pathname
 * @returns boolean indicating if the current page should show header and footer
 */
export function shouldShowHeaderFooter(pathname?: string): boolean {
  if (typeof window !== 'undefined' && !pathname) {
    pathname = window.location.pathname;
  }
  
  // Check if the path is for admin or vendor pages
  if (pathname?.includes('/admin') || pathname?.includes('/vendor')) {
    return false;
  }
  
  // List of other paths that should NOT have header and footer
  const noHeaderFooterPaths = [
    '/checkout',
    '/auth',
    '/payment-success',
    '/payment-failure'
  ];
  
  // Check if the current path starts with any of the excluded paths
  return !noHeaderFooterPaths.some(path => pathname?.startsWith(path));
}

/**
 * Get the appropriate button class based on whether it's a customer-facing page or admin/vendor page
 * @param pathname The current pathname
 * @returns string with the appropriate button class
 */
export function getButtonClass(pathname?: string): string {
  if (isAdminOrVendorPage(pathname)) {
    return "bg-green-500 hover:bg-green-600";
  } else {
    return "customer-btn"; // This class is defined in globals.css
  }
}
