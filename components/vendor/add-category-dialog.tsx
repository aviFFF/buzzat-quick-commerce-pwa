"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { uploadProductImage, uploadImageFromUrl } from "@/lib/cloudinary/upload"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AddCategoryDialog({ onSuccess }: { onSuccess?: () => void }) {
  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconUrl, setIconUrl] = useState<string>("")
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Handle icon file selection
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      setIconFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }
    
    setIsUploading(true)
    try {
      let finalIconUrl = ""
      let iconPublicId = ""
      
      // Handle icon based on upload method
      if (uploadMethod === 'file' && iconFile) {
        // Upload icon file if provided
        const uploadResult = await uploadProductImage(iconFile, 'vendor')
        if (!uploadResult.success) {
          throw new Error(uploadResult.errorMessage || "Failed to upload icon image")
        }
        finalIconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
      } else if (uploadMethod === 'url' && iconUrl) {
        // Upload the image from the provided URL
        if (!iconUrl) {
          throw new Error("Please provide an image URL")
        }
        const uploadResult = await uploadImageFromUrl(iconUrl, 'vendor')
        if (!uploadResult.success) {
          throw new Error(uploadResult.errorMessage || "Failed to upload image from URL")
        }
        finalIconUrl = uploadResult.url || ""
        iconPublicId = uploadResult.public_id || ""
      } else {
        // Use default icon if none provided
        finalIconUrl = "/icons/grocery.png"
      }
      
      // Create category document
      await addDoc(collection(db, "categories"), {
        name: newCategory.name,
        icon: finalIconUrl,
        iconPublicId: iconPublicId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Reset form
      setNewCategory({ name: "", icon: "" })
      setIconFile(null)
      setIconPreview(null)
      setIconUrl("")
      setIsDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Category was added successfully"
      })
      
      // Call the success callback
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err: any) {
      console.error("Error adding category:", err)
      toast({
        title: "Error",
        description: `Failed to add category: ${err.message}`,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new product category with name and icon.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              placeholder="e.g. Fruits & Vegetables"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
          </div>
          
          <Tabs defaultValue="file" onValueChange={(v) => setUploadMethod(v as "file" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iconFile">Icon (Optional)</Label>
                <Input
                  id="iconFile"
                  type="file"
                  accept="image/*"
                  onChange={handleIconFileChange}
                />
              </div>
              {iconPreview && (
                <div className="mt-2 flex justify-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded border">
                    <Image
                      src={iconPreview}
                      alt="Icon Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iconUrl">Icon URL (Optional)</Label>
                <Input
                  id="iconUrl"
                  type="url"
                  placeholder="https://example.com/icon.png"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddCategory} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isUploading ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 