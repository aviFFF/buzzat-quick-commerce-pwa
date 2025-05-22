"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import ProductGrid from "@/components/product-grid"
import { getAllCategories } from "@/lib/firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"

interface Category {
  id: string
  name: string
  icon: string
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const allCategories = await getAllCategories()
        setCategories(allCategories as Category[])
        
        // Find the current category to display its name
        const currentCategory = allCategories.find(cat => cat.id === slug)
        if (currentCategory) {
          setCategoryName(currentCategory.name)
        }
        
        // Log to debug
        console.log("Category loaded:", { slug, categoryName: currentCategory?.name, categoriesCount: allCategories.length })
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCategories()
  }, [slug])

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-12 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        </div>
      </>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">{categoryName || slug}</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Categories Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-lg mb-4">Categories</h2>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.id}`}
                      className={`flex items-center p-2 rounded-md ${
                        category.id === slug 
                          ? "bg-green-50 text-green-600 font-medium" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative w-8 h-8 mr-2">
                        <Image 
                          src={category.icon || "/logo.webp"} 
                          alt={category.name} 
                          width={32} 
                          height={32}
                          className="object-contain" 
                        />
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <ProductGrid category={slug} />
          </div>
        </div>
      </div>
    </main>
  )
} 