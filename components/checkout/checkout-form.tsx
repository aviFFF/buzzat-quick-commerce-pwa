"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, MapPin, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { createOrder } from "@/lib/firebase/firestore"

export default function CheckoutForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { cartItems, clearCart } = useCart()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    city: "",
    deliveryOption: "standard",
    paymentMethod: "cod",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
      const deliveryFee = formData.deliveryOption === "standard" ? 40 : 60
      const totalAmount = subtotal + deliveryFee

      const orderData = {
        userId: user.uid,
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
        deliveryFee,
        address: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          pincode: formData.pincode,
          city: formData.city,
        },
        paymentMethod: formData.paymentMethod as "cod" | "online",
        paymentStatus: "pending",
        orderStatus: "pending",
      }

      // If payment method is online, we would redirect to payment gateway here
      // For now, we'll just create the order directly

      const result = await createOrder(orderData)

      if (result.id) {
        clearCart()
        toast({
          title: "Order placed successfully!",
          description: `Your order #${result.id.slice(0, 8).toUpperCase()} has been placed.`,
        })
        router.push(`/checkout/success?orderId=${result.id}`)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Failed to place order",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin size={18} className="mr-2" />
          Delivery Address
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" value={formData.pincode} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={formData.city} onChange={handleChange} required />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Truck size={18} className="mr-2" />
          Delivery Options
        </h2>

        <RadioGroup
          defaultValue="standard"
          value={formData.deliveryOption}
          onValueChange={(value) => handleRadioChange("deliveryOption", value)}
        >
          <div className="flex items-center space-x-2 border p-4 rounded-lg mb-2">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard" className="flex-1 cursor-pointer">
              <div className="font-medium">Standard Delivery</div>
              <div className="text-sm text-gray-500">Delivery within 30-60 minutes</div>
            </Label>
            <span className="font-medium">₹40</span>
          </div>

          <div className="flex items-center space-x-2 border p-4 rounded-lg">
            <RadioGroupItem value="express" id="express" />
            <Label htmlFor="express" className="flex-1 cursor-pointer">
              <div className="font-medium">Express Delivery</div>
              <div className="text-sm text-gray-500">Delivery within 15-30 minutes</div>
            </Label>
            <span className="font-medium">₹60</span>
          </div>
        </RadioGroup>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <CreditCard size={18} className="mr-2" />
          Payment Method
        </h2>

        <RadioGroup
          defaultValue="cod"
          value={formData.paymentMethod}
          onValueChange={(value) => handleRadioChange("paymentMethod", value)}
        >
          <div className="flex items-center space-x-2 border p-4 rounded-lg mb-2">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="flex-1 cursor-pointer">
              <div className="font-medium">Cash on Delivery</div>
              <div className="text-sm text-gray-500">Pay when your order arrives</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 border p-4 rounded-lg">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online" className="flex-1 cursor-pointer">
              <div className="font-medium">Online Payment</div>
              <div className="text-sm text-gray-500">Pay now with card, UPI, or wallet</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Place Order"}
      </Button>
    </form>
  )
}
