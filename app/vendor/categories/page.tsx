"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import AddCategoryDialog from "@/components/vendor/add-category-dialog"
import ManageCategoryDialog from "@/components/vendor/manage-category-dialog"
import ImportCategoriesDialog from "@/components/vendor/import-categories-dialog"
import Image from "next/image"

interface Category {
  id: string
  name: string
  productCount: number
  pincodes: string[]
}

interface DbCategory {
  id: string
  name: string
  icon: string
  iconPublicId?: string
}

interface Product {
  id: string
  category: string
  pincodes: string[]
  [key: string]: any
}

export default function VendorCategoriesPage() {
  const { vendor } = useVendor()
  const [categories, setCategories] = useState<Category[]>([])
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPincode, setSelectedPincode] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Fetch categories for this vendor based on pincode
  useEffect(() => {
    if (!vendor) return

    const fetchCategoriesForVendor = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, fetch vendor's products
        const productsQuery = query(
          collection(db, "products"),
          where("vendorId", "==", vendor.id),
          where("status", "!=", "deleted")
        )

        const productsSnapshot = await getDocs(productsQuery)
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]

        // Extract categories and count products per category
        const categoryMap = new Map<string, Category>()

        productsData.forEach(product => {
          const category = product.category
          const pincodes = product.pincodes || []
          
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              id: category,
              name: category,
              productCount: 1,
              pincodes: [...pincodes]
            })
          } else {
            const existingCategory = categoryMap.get(category)!
            existingCategory.productCount++
            
            // Add unique pincodes
            pincodes.forEach((pincode: string) => {
              if (!existingCategory.pincodes.includes(pincode)) {
                existingCategory.pincodes.push(pincode)
              }
            })
          }
        })

        const categoriesData = Array.from(categoryMap.values())
        setCategories(categoriesData)

        // Set default pincode if available
        if (vendor.pincodes && vendor.pincodes.length > 0) {
          setSelectedPincode(vendor.pincodes[0])
        }
        
        // Fetch global categories from database
        const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
        const categoriesSnapshot = await getDocs(categoriesQuery)
        const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DbCategory[]
        setDbCategories(fetchedCategories)
        
      } catch (error: any) {
        setError(`Error loading categories: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoriesForVendor()
  }, [vendor])

  // Filter categories based on selected pincode
  const filteredCategories = selectedPincode
    ? categories.filter(category => category.pincodes.includes(selectedPincode))
    : categories

  // Filter global categories based on search term
  const filteredDbCategories = searchTerm
    ? dbCategories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : dbCategories

  // Handler to refresh data after adding a new category
  const handleCategoryAdded = () => {
    if (vendor) {
      // Re-fetch all categories
      const fetchGlobalCategories = async () => {
        try {
          const categoriesQuery = query(collection(db, "categories"), orderBy("name"))
          const categoriesSnapshot = await getDocs(categoriesQuery)
          const fetchedCategories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as DbCategory[]
          setDbCategories(fetchedCategories)
        } catch (error) {
          console.error("Error refreshing categories:", error)
        }
      }
      
      fetchGlobalCategories()
    }
  }

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex gap-2">
          <ImportCategoriesDialog onSuccess={handleCategoryAdded} />
          <AddCategoryDialog onSuccess={handleCategoryAdded} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories by Pincode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCategories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Global Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbCategories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="max-w-xs">
          <Label htmlFor="pincode-filter">Filter by Pincode</Label>
          <select
            id="pincode-filter"
            className="w-full p-2 border rounded"
            value={selectedPincode}
            onChange={(e) => setSelectedPincode(e.target.value)}
          >
            <option value="">All Pincodes</option>
            {vendor.pincodes?.map(pincode => (
              <option key={pincode} value={pincode}>{pincode}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Pincodes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.productCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.pincodes.slice(0, 3).map(pincode => (
                          <Badge key={pincode} variant="outline">{pincode}</Badge>
                        ))}
                        {category.pincodes.length > 3 && (
                          <Badge variant="outline">+{category.pincodes.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No categories found for the selected pincode.
          </div>
        )}
        
        <div className="pt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Available Categories</h2>
            <div className="max-w-xs">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredDbCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredDbCategories.map((category) => (
                <div key={category.id} className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 mb-2">
                      <Image 
                        src={category.icon || "/icons/grocery.svg"} 
                        alt={category.name} 
                        width={64} 
                        height={64} 
                        className="object-contain" 
                      />
                    </div>
                    <span className="text-sm text-center font-medium text-gray-800 mb-2">{category.name}</span>
                    <ManageCategoryDialog 
                      category={category} 
                      onSuccess={handleCategoryAdded} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No categories found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 