"use client"
import { useState, useEffect } from "react"
import { usePincode } from "@/lib/hooks/use-pincode"
import { getCategoriesByPincode } from "@/lib/firebase/firestore"
import ProductSlider from "@/components/product-slider"
import { Loader2 } from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface Category {
  id: string
  name: string
  icon: string
}

export default function DynamicCategorySlider() {
  const { pincode } = usePincode()
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})

  // Fetch category info first
  useEffect(() => {
    const fetchCategoryMap = async () => {
      try {
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)
        
        const categoryMapData: Record<string, string> = {};
        categoriesSnapshot.docs.forEach(doc => {
          categoryMapData[doc.id] = doc.data().name;
        });
        
        setCategoryMap(categoryMapData);
      } catch (error) {
        console.error("Error fetching category map:", error)
      }
    };
    
    fetchCategoryMap();
  }, []);

  // Fetch available categories by pincode
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      if (!pincode) {
        setCategories([])
        setIsLoading(false)
        return
      }

      try {
        const availableCategories = await getCategoriesByPincode(pincode)
        setCategories(availableCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [pincode])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No products available for your location. Please try another pincode.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {categories.map(categoryId => (
        <div key={categoryId} className="my-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {categoryMap[categoryId] || 
                categoryId.split("-").map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(" ")}
            </h2>
            <a href={`/category/${categoryId}`} className="text-green-600 font-medium">
              see all
            </a>
          </div>
          <ProductSlider category={categoryId} />
        </div>
      ))}
    </div>
  )
} 