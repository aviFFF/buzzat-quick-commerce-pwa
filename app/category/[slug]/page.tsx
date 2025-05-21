import { Suspense } from "react"
import Header from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"
import ProductGrid from "@/components/product-grid"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryMap: Record<string, string> = {
    "fruits-vegetables": "Fruits & Vegetables",
    "dairy-bread-eggs": "Dairy, Bread & Eggs",
    "masala-oils": "Masala and Oils",
    "drinks-juice": "Drinks and Juice",
    "namkeen-biscuits": "Namkeen and Biscuits",
    "dry-fruits": "Dry Fruits and Instant Food",
    "pharma-wellness": "Pharma and Wellness",
    "cleaning-essentials": "Cleaning Essentials",
    "aata-dal-rice": "Aataa Dal Rice",
  }

  const categoryName =
    categoryMap[params.slug] ||
    params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">{categoryName}</h1>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid category={params.slug} />
        </Suspense>
      </div>
    </main>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="p-4 border rounded-lg bg-white">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  )
}
