"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export default function DeliveryBanner() {
  const [deliveryTime, setDeliveryTime] = useState("8")
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show banner when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && isVisible && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY && !isVisible) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isVisible, lastScrollY])

  return (
    <div className={`transition-all duration-300 ${
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
    } md:hidden bg-amber-100 rounded-lg p-3 mb-4 flex items-center sticky top-[60px] z-10`}>
      <div className="font-bold text-gray-800">
        <span className="block">Delivery in</span>
        <span className="text-lg">{deliveryTime} minutes</span>
      </div>
      <div className="ml-auto flex items-center text-xs rounded-full">
        <Clock size={16} className="text-gray-600 mr-1" />
        <span className="font-medium">Fastest Delivery</span>
      </div>
    </div>
  )
} 