import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Header from "@/components/header"
import CheckoutForm from "@/components/checkout/checkout-form"
import OrderSummary from "@/components/checkout/order-summary"
import ProtectedRoute from "@/components/auth/protected-route"
import { Skeleton } from "@/components/ui/skeleton"

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ChevronLeft size={20} />
            <span>Continue Shopping</span>
          </Link>

          <h1 className="text-2xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Suspense fallback={<CheckoutFormSkeleton />}>
                <CheckoutForm />
              </Suspense>
            </div>

            <div>
              <Suspense fallback={<OrderSummarySkeleton />}>
                <OrderSummary />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

function OrderSummarySkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
