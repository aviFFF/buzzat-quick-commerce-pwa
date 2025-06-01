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
  
  return !!pathname && (pathname.startsWith('/admin') || pathname.startsWith('/vendor'));
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
