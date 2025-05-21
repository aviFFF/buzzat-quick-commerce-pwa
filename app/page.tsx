import { Suspense } from "react"
import Header from "@/components/header"
import PincodeSelector from "@/components/pincode-selector"
import CategoryGrid from "@/components/category-grid"
import FeaturedBanner from "@/components/featured-banner"
import ProductSlider from "@/components/product-slider"
import { Skeleton } from "@/components/ui/skeleton"
import DynamicCategorySlider from "@/components/dynamic-category-slider"
import CheckPincodeRedirect from "@/components/check-pincode-redirect"

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
      <div className="container mx-auto px-4 pb-20">
        <PincodeSelector />
        
        {/* Check if pincode is serviceable and redirect if not */}
        <CheckPincodeRedirect />

        <Suspense fallback={<BannerSkeleton />}>
          <FeaturedBanner />
        </Suspense>

        <div className="my-6">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">Shop by Category</h2>
          <Suspense fallback={<CategorySkeleton />}>
            <CategoryGrid />
          </Suspense>
        </div>

        {/* Dynamic Category Slider that shows only categories with available products */}
        <div className="my-8">
          <h2 className="text-2xl font-bold text-orange-600 mb-6">Available in Your Area</h2>
          <Suspense fallback={<ProductSliderSkeleton />}>
            <DynamicCategorySlider />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

function BannerSkeleton() {
  return <Skeleton className="w-full h-48 rounded-lg" />
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
