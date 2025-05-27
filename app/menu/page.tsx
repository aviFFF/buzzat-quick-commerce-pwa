import Link from "next/link"
import { 
  ShoppingBag, 
  User, 
  Home, 
  Clock, 
  MapPin, 
  Heart, 
  HelpCircle, 
  Info, 
  PhoneCall, 
  Settings 
} from "lucide-react"
import Header from "@/components/header"

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">Menu</h1>
        
        <div className="bg-white rounded-lg shadow-sm divide-y">
          <MenuItem 
            href="/"
            icon={<Home className="text-emerald-600" size={20} />}
            label="Home"
          />
          <MenuItem 
            href="/category"
            icon={<ShoppingBag className="text-emerald-600" size={20} />}
            label="Shop by Category"
          />
          <MenuItem 
            href="/account/profile"
            icon={<User className="text-emerald-600" size={20} />}
            label="My Account"
          />
          <MenuItem 
            href="/account/orders"
            icon={<Clock className="text-emerald-600" size={20} />}
            label="My Orders"
          />
          <MenuItem 
            href="/account/addresses"
            icon={<MapPin className="text-emerald-600" size={20} />}
            label="My Addresses"
          />
          <MenuItem 
            href="/wishlist"
            icon={<Heart className="text-emerald-600" size={20} />}
            label="My Wishlist"
          />
        </div>
        
        <h2 className="text-lg font-semibold mt-8 mb-4">Help & Settings</h2>
        <div className="bg-white rounded-lg shadow-sm divide-y">
          <MenuItem 
            href="/help"
            icon={<HelpCircle className="text-gray-600" size={20} />}
            label="Help Center"
          />
          <MenuItem 
            href="/about"
            icon={<Info className="text-gray-600" size={20} />}
            label="About Us"
          />
          <MenuItem 
            href="/contact"
            icon={<PhoneCall className="text-gray-600" size={20} />}
            label="Contact Us"
          />
          <MenuItem 
            href="/settings"
            icon={<Settings className="text-gray-600" size={20} />}
            label="App Settings"
          />
        </div>
      </div>
    </main>
  )
}

interface MenuItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link 
      href={href}
      className="flex items-center py-4 px-4 hover:bg-gray-50"
    >
      <div className="mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-gray-400">›</span>
    </Link>
  )
} 