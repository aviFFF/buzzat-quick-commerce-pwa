"use client"

import { useState, useEffect } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { db } from "@/lib/firebase/config"
import { doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getGlobalPincodes } from "@/lib/firebase/admin"

export default function VendorPincodePage() {
  const { vendor, refreshVendorData } = useVendor()
  const [availablePincodes, setAvailablePincodes] = useState<string[]>([])
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available pincodes and vendor's selected pincodes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get all pincodes defined by admin
        const pincodes = await getGlobalPincodes()
        setAvailablePincodes(pincodes)

        // Set vendor's selected pincodes
        if (vendor?.pincodes) {
          setSelectedPincodes(vendor.pincodes)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load pincodes")
        console.error("Error loading pincodes:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (vendor) {
      loadData()
    }
  }, [vendor])

  // Handle pincode selection change
  const handlePincodeChange = (pincode: string) => {
    setSelectedPincodes(prev => {
      if (prev.includes(pincode)) {
        return prev.filter(p => p !== pincode)
      } else {
        return [...prev, pincode]
      }
    })
  }

  // Save selected pincodes
  const handleSave = async () => {
    if (!vendor) return
    if (selectedPincodes.length === 0) {
      toast({
        variant: "destructive",
        title: "No pincodes selected",
        description: "You must select at least one pincode for delivery area.",
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Update vendor document
      await updateDoc(doc(db, "vendors", vendor.id), {
        pincodes: selectedPincodes,
      })

      // Refresh vendor data
      await refreshVendorData()

      toast({
        title: "Pincodes updated",
        description: "Your delivery areas have been updated successfully.",
      })
    } catch (err: any) {
      setError(err.message || "Failed to update pincodes")
      toast({
        variant: "destructive",
        title: "Failed to update pincodes",
        description: err.message,
      })
    } finally {
      setIsSaving(false)
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
        <h1 className="text-2xl font-bold">Delivery Areas</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage Delivery Areas</CardTitle>
          <CardDescription>
            Select the pincodes where you can deliver products. Your products will only be visible to customers in these areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : availablePincodes.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No pincodes available</AlertTitle>
              <AlertDescription>
                No delivery areas have been defined by the administrator yet. Please contact support.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {availablePincodes.map(pincode => (
                  <div key={pincode} className="flex items-center space-x-2 border rounded-md p-2">
                    <Checkbox
                      id={`pincode-${pincode}`}
                      checked={selectedPincodes.includes(pincode)}
                      onCheckedChange={() => handlePincodeChange(pincode)}
                    />
                    <Label htmlFor={`pincode-${pincode}`} className="cursor-pointer">
                      {pincode}
                    </Label>
                  </div>
                ))}
              </div>

              <Alert variant="default" className="bg-blue-50 mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You have selected {selectedPincodes.length} of {availablePincodes.length} delivery areas.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || selectedPincodes.length === 0}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 