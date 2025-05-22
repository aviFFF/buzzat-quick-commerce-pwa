"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, User, LogOut, ChevronDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/context/auth-context"
import { useFirebase } from "@/lib/context/firebase-provider"
import { LoginModal } from "./auth/login-modal"
import PincodeSelector from "./pincode-selector"
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog"
import { Input as DialogInput } from "@/components/ui/input"
import { usePincode } from "@/lib/hooks/use-pincode"
import { isPincodeServiceable } from "@/lib/firebase/firestore"
import { useRouter } from "next/navigation"
import CartItem from "./cart-item"

export default function Header() {
  const { cartItems, cartCount, clearCart } = useCart()
  const { user, signOut, loading: authLoading } = useAuth()
  const { isAuthInitialized, isLoading: firebaseLoading } = useFirebase()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Pincode related state
  const { pincode, updatePincode, isLoading: pincodeLoading } = usePincode()
  const [inputPincode, setInputPincode] = useState("")
  const [openPincodeDialog, setOpenPincodeDialog] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  
  // Estimate delivery time (would come from admin/backend)
  const [deliveryTime, setDeliveryTime] = useState("8")

  // Only show auth UI after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Update input pincode when pincode changes
    if (pincode) {
      setInputPincode(pincode)
    }
  }, [pincode])

  const handleSignOut = async () => {
    await signOut()
  }
  
  // Handle pincode submission
  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPincode.length === 6 && /^\d+$/.test(inputPincode)) {
      setIsChecking(true)
      
      try {
        // Check if pincode is changing
        if (pincode !== inputPincode) {
          // Clear cart immediately when pincode changes
          clearCart()
        }
        
        // Check if the pincode is serviceable
        const serviceable = await isPincodeServiceable(inputPincode)
        
        // Save pincode regardless of serviceability
        updatePincode(inputPincode)
        setOpenPincodeDialog(false)
        
        if (serviceable) {
          // Reload the page to fetch new data based on updated pincode
          window.location.reload()
        } else {
          // Redirect to coming soon page if not serviceable
          router.push("/coming-soon")
        }
      } catch (error) {
        console.error("Error checking pincode serviceability:", error)
        // On error, update pincode and reload anyway
        updatePincode(inputPincode)
        setOpenPincodeDialog(false)
        window.location.reload()
      } finally {
        setIsChecking(false)
      }
    }
  }

  // Determine if we're in a loading state
  const loading = !mounted || firebaseLoading || authLoading || !isAuthInitialized

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center">
            <Image src="/logo.webp" alt="Buzzat" width={90} height={36} className="h-9 w-auto" priority />
          </Link>
          
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-700 p-1">
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 p-1"
                onClick={() => setShowLoginModal(true)}
                disabled={!isAuthInitialized}
              >
                <User size={20} />
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative p-1">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl px-0">
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full mt-1"></div>
                </div>
                <div className="h-full flex flex-col px-4">
                  <div className="flex justify-between items-center pb-3 border-b mb-2">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        ×
                      </Button>
                    </SheetTrigger>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <ShoppingCart size={64} className="text-gray-300 mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <Button className="mt-4 bg-green-500 hover:bg-green-600">Start Shopping</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto pb-4">
                        {cartItems.map(item => (
                          <CartItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            price={item.price}
                            unit={item.unit}
                            image={item.image}
                            quantity={item.quantity}
                          />
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-auto">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                          <span>Delivery Fee</span>
                          <span>₹40.00</span>
                        </div>
                        <div className="flex justify-between font-bold mb-4">
                          <span>Total</span>
                          <span>₹{(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40).toFixed(2)}</span>
                        </div>
                        <Button className="w-full bg-green-500 hover:bg-green-600 mb-4">Proceed to Checkout</Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Work location selector and pincode for mobile */}
        <Dialog open={openPincodeDialog} onOpenChange={setOpenPincodeDialog}>
          <DialogTrigger asChild>
            <div className="flex items-center px-4 py-1 bg-gray-50 text-sm font-medium cursor-pointer">
              <div className="flex items-center">
                {/* <span className="mr-1">Home</span> */}
                <span className="text-gray-600">
                  
                  Aliganj,Lucknow</span>
                <ChevronDown size={16} className="ml-1 text-gray-500" />
              </div>
              <div className="ml-auto text-xs text-gray-500">
                {pincodeLoading ? "Loading..." : `PIN: ${pincode}`}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter your delivery pincode</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePincodeSubmit} className="space-y-4">
              <DialogInput
                type="text"
                placeholder="Enter 6-digit pincode"
                value={inputPincode}
                onChange={(e) => setInputPincode(e.target.value)}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={inputPincode.length !== 6 || !/^\d+$/.test(inputPincode) || isChecking}
              >
                {isChecking ? "Checking..." : "Continue"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Search bar for mobile */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="search"
              placeholder='Search "milk"'
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.webp" alt="Buzzat" width={100} height={40} className="h-20" priority />
            </Link>
            
            <div className="ml-4">
              <PincodeSelector headerStyle={true} />
            </div>
          </div>

          <div className="flex relative w-1/2 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="search"
              placeholder="Search for your needs..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-700">
                    <User size={20} className="mr-2" />
                    <span className="hidden md:inline">{user.phoneNumber}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700"
                onClick={() => setShowLoginModal(true)}
                disabled={!isAuthInitialized}
              >
                <User size={20} className="mr-2" />
                <span className="hidden md:inline">Login</span>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl px-0">
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full mt-1"></div>
                </div>
                <div className="h-full flex flex-col px-4">
                  <div className="flex justify-between items-center pb-3 border-b mb-2">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        ×
                      </Button>
                    </SheetTrigger>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <ShoppingCart size={64} className="text-gray-300 mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <Button className="mt-4 bg-green-500 hover:bg-green-600">Start Shopping</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto pb-4">
                        {cartItems.map(item => (
                          <CartItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            price={item.price}
                            unit={item.unit}
                            image={item.image}
                            quantity={item.quantity}
                          />
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-auto">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                          <span>Delivery Fee</span>
                          <span>₹40.00</span>
                        </div>
                        <div className="flex justify-between font-bold mb-4">
                          <span>Total</span>
                          <span>₹{(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 40).toFixed(2)}</span>
                        </div>
                        <Button className="w-full bg-green-500 hover:bg-green-600 mb-4">Proceed to Checkout</Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </header>
  )
}
