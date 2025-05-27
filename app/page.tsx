import { Suspense } from "react"
import Header from "@/components/header"
import CategoryGrid from "@/components/category-grid"
import { Skeleton } from "@/components/ui/skeleton"
import DynamicCategorySlider from "@/components/dynamic-category-slider"
import CheckPincodeRedirect from "@/components/check-pincode-redirect"
import BannerCardsDisplay from "@/components/banner-cards-display"
import DeliveryBanner from "@/components/delivery-banner"

// Define categories to be displayed on the homepage
const featuredCategories = [
  {
    id: "fruits-vegetables",
    name: "Fruits & Vegetables"
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs"
  },
  {
    id: "grocery",
    name: "Grocery & Staples"
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-2 px-4">
        {/* Check if pincode is serviceable and redirect if not */}
        <CheckPincodeRedirect />
        
        {/* Scrolling Delivery Banner */}
        <DeliveryBanner />

        {/* Desktop banners and first mobile banner (above categories) */}
        <Suspense fallback={<BannerSkeleton />}>
          <BannerCardsDisplay position="top" />
        </Suspense>

        {/* Categories grid with rounded icons */}
        <div className="my-6">
          <Suspense fallback={<CategorySkeleton />}>
            <CategoryGrid />
          </Suspense>
        </div>

        {/* Second mobile banner (below categories) */}
        <Suspense fallback={<div className="md:hidden my-6"><Skeleton className="w-full h-32 rounded-lg" /></div>}>
          <BannerCardsDisplay position="middle" />
        </Suspense>

        {/* Dynamic Category Slider that shows only categories with available products */}
        <div className="my-8">
          <Suspense fallback={<ProductSliderSkeleton />}>
            <DynamicCategorySlider />
          </Suspense>
        </div>
        
        {/* Third mobile banner (above footer) */}
        <Suspense fallback={<div className="md:hidden my-6"><Skeleton className="w-full h-32 rounded-lg" /></div>}>
          <BannerCardsDisplay position="bottom" />
        </Suspense>
      </div>
    </main>
  )
}

function BannerSkeleton() {
  return <Skeleton className="w-full h-32 md:h-48 rounded-lg" />
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
    </div>
  )
}

function ProductSliderSkeleton() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="w-44 flex-shrink-0">
            <Skeleton className="h-44 w-44 rounded-lg" />
            <Skeleton className="h-4 w-32 mt-2" />
            <Skeleton className="h-4 w-16 mt-1" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  )
}
