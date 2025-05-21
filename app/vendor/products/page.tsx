"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Trash2, Edit, ShoppingBag } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { deleteProductImage } from "@/lib/cloudinary/upload"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  mrp: number
  image: string
  imagePublicId?: string
  additionalImages?: Array<{
    url: string;
    path?: string;
    public_id?: string;
  }>
  unit: string
  stock: number
  vendorId: string
  pincodes?: string[]
  status: "active" | "out_of_stock" | "deleted"
}

export default function VendorProductsPage() {
  const { vendor } = useVendor()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<{ id: string, price: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch products for this vendor
  useEffect(() => {
    if (!vendor) return

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
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

        setProducts(productsData)
      } catch (error: any) {
        setError(`Error loading products: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [vendor])

  // Toggle product status (in stock / out of stock)
  const toggleProductStatus = async (productId: string, currentStatus: Product["status"]) => {
    try {
      const newStatus = currentStatus === "active" ? "out_of_stock" : "active"

      await updateDoc(doc(db, "products", productId), {
        status: newStatus
      })

      // Update local state
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, status: newStatus }
          : product
      ))

      toast({
        title: "Status updated",
        description: `Product is now ${newStatus === "active" ? "in stock" : "out of stock"}.`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message,
      })
    }
  }

  // Start editing product price
  const startEditingPrice = (productId: string, currentPrice: number) => {
    setEditingProduct({ id: productId, price: currentPrice })
  }

  // Update product price
  const updateProductPrice = async () => {
    if (!editingProduct) return

    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        price: editingProduct.price
      })

      // Update local state
      setProducts(products.map(product =>
        product.id === editingProduct.id
          ? { ...product, price: editingProduct.price }
          : product
      ))

      toast({
        title: "Price updated",
        description: "Product price has been updated successfully.",
      })

      // Clear editing state
      setEditingProduct(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update price",
        description: error.message,
      })
    }
  }

  // Delete product
  const deleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);

    try {
      // First, delete the product image from Cloudinary if it exists
      if (productToDelete.imagePublicId) {
        try {
          await deleteProductImage(productToDelete.imagePublicId);
        } catch (error) {
          console.error("Error deleting product image:", error);
          // Continue with product deletion even if image deletion fails
        }
      }

      // Delete any additional images if they exist
      if (productToDelete.additionalImages && Array.isArray(productToDelete.additionalImages)) {
        for (const img of productToDelete.additionalImages) {
          // Handle both Cloudinary public_id and Firebase path
          const imageId = img.public_id || img.path;
          if (imageId) {
            try {
              await deleteProductImage(imageId);
            } catch (error) {
              console.error("Error deleting additional image:", error);
              // Continue anyway
            }
          }
        }
      }

      // Then delete the product from Firestore
      await deleteDoc(doc(db, "products", productToDelete.id));

      // Update local state
      setProducts(products.filter(p => p.id !== productToDelete.id));

      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: error.message,
      });
    } finally {
      setProductToDelete(null);
      setIsDeleting(false);
    }
  };

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/vendor/products/add">Add New Product</Link>
        </Button>
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
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "out_of_stock").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>Manage your products, update stock, or change availability.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No products found.</p>
              <Button asChild>
                <Link href="/vendor/products/add">Add Your First Product</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {editingProduct?.id === product.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            className="w-24"
                            type="number"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              price: parseFloat(e.target.value)
                            })}
                          />
                          <Button size="sm" onClick={updateProductPrice}>Save</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>₹{product.price}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPrice(product.id, product.price)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status === "active"}
                          onCheckedChange={() => toggleProductStatus(product.id, product.status)}
                        />
                        <Badge
                          variant={product.status === "active" ? "default" : "secondary"}
                        >
                          {product.status === "active" ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/vendor/products/edit/${product.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
