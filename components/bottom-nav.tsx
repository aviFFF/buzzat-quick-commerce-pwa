"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid, Clock, User } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t shadow-lg">
      <div className="flex justify-around items-center h-16">
        <NavItem 
          href="/" 
          icon={<Home size={24} />} 
          label="Home"
          isActive={pathname === "/"}
        />
        <NavItem 
          href="/categories" 
          icon={<Grid size={24} />} 
          label="Categories"
          isActive={pathname.startsWith("/category")}
        />
        <NavItem 
          href="/account/orders" 
          icon={<Clock size={24} />} 
          label="Orders"
          isActive={pathname === "/account/orders"}
        />
        <NavItem 
          href="/account/profile" 
          icon={<User size={24} />} 
          label="Profile"
          isActive={pathname === "/account/profile"}
        />
      </div>
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center justify-center w-full py-1 ${
        isActive ? "text-emerald-600" : "text-gray-500"
      }`}
    >
      <div className="flex justify-center">{icon}</div>
      <span className="text-xs mt-1">{label}</span>
      {isActive && (
        <div className="w-1/2 h-1 bg-emerald-600 rounded-full mt-1"></div>
      )}
    </Link>
  )
} 