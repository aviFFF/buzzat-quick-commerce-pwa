import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import Header from "@/components/header"
import AddToCartButton from "@/components/add-to-cart-button"
import { getProductById } from "@/lib/firebase/firestore"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: {
    id: string
  }
}

// Define a simplified product type for the cart
interface CartProduct {
  id: string
  name: string
  price: number
  unit: string
  image: string
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productId = params.id
  const product = await getProductById(productId)

  if (!product) {
    notFound()
  }

  // Create a simplified product object for the cart
  const cartProduct: CartProduct = {
    id: product.id || productId, // Use the params id as fallback
    name: product.name,
    price: product.price,
    unit: product.unit,
    image: product.image
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Link
          href={`/category/${product.category}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft size={20} />
          <span>
            Back to{" "}
            {product.category
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </span>
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative aspect-square">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-contain" />
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
              <p className="text-gray-500 mb-4">{product.unit}</p>

              <div className="flex items-baseline gap-3 mb-6">
                <div className="text-3xl font-bold">₹{product.price}</div>
                {product.mrp > product.price && (
                  <>
                    <div className="text-lg text-gray-500 line-through">₹{product.mrp}</div>
                    <div className="text-sm text-green-600 font-medium">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                    </div>
                  </>
                )}
              </div>

              <p className="text-gray-700 mb-8">{product.description}</p>

              <AddToCartButton product={cartProduct} className="mt-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/" className="text-green-500 hover:text-green-600 font-medium">
          Return to Home
        </Link>
      </div>
    </div>
  )
}
