import { Suspense } from "react"
import Header from "@/components/header"
import CategoryGrid from "@/components/category-grid"
import { Skeleton } from "@/components/ui/skeleton"
import DynamicCategorySlider from "@/components/dynamic-category-slider"
import CheckPincodeRedirect from "@/components/check-pincode-redirect"
import BannerCardsDisplay from "@/components/banner-cards-display"
import BannerCard from "@/components/banner-card"
import BottomNav from "@/components/bottom-nav"
import DeliveryBanner from "@/components/delivery-banner"

// Define categories to be displayed on the homepage
const featuredCategories = [
  {
    id: "fruits-vegetables",
    name: "Fruits & Vegetables"
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs"
  },
  {
    id: "grocery",
    name: "Grocery & Staples"
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">      <Header />      <div className="container mx-auto py-2 px-4">        {/* Check if pincode is serviceable and redirect if not */}        <CheckPincodeRedirect />                {/* Scrolling Delivery Banner */}        <DeliveryBanner />        {/* Main featured banner (replaces Frequently bought section) */}
      <div className="mt-4b block md:hidden mb-6">
        <Suspense fallback={<BannerSkeleton />}>
          <BannerCard
            title="Special Offers & Discounts"
            imageUrl="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80"
            link="/category/offers"
            className="w-full"
          />
        </Suspense>
      </div>

      {/* Categories grid with rounded icons */}
      <div className="my-6">
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryGrid />
        </Suspense>
      </div>

      {/* Banner Cards - desktop view (multiple banners) and mobile view (top banner) */}
      <Suspense fallback={<BannerSkeleton />}>
        <BannerCardsDisplay />
      </Suspense>

      {/* Dynamic Category Slider that shows only categories with available products */}
      <div className="my-8">
        <Suspense fallback={<ProductSliderSkeleton />}>
          <DynamicCategorySlider />
        </Suspense>
      </div>

      {/* Bottom card for mobile view */}
      <Suspense fallback={<div className="md:hidden my-6"><Skeleton className="w-full h-32 rounded-lg" /></div>}>
        <MobilePositionCard position="bottom" />
      </Suspense>
    </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  )
}

// Component to fetch specific position card
function MobilePositionCard({ position }: { position: 'middle' | 'bottom' }) {
  return (
    <div className="md:hidden my-6 banner-card-container">
      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden shadow-md relative">
        {/* This is static fallback content that will show immediately */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-4 z-10">
          <h3 className="text-lg font-bold text-white">
            {position === 'middle' ? 'Dairy Products' : 'Grocery & Staples'}
          </h3>
          <div className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-3 py-1 rounded-full w-fit text-sm">
            Explore →
          </div>
        </div>

        {/* Fallback image */}
        <img
          src={position === 'middle'
            ? "https://images.unsplash.com/photo-1628088062854-d1870b4553da"
            : "https://images.unsplash.com/photo-1579113800032-c38bd7635818"}
          alt={position === 'middle' ? 'Dairy Products' : 'Grocery & Staples'}
          className="object-cover w-full h-full"
        />

        {/* Dynamic content will replace this via JavaScript */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                try {
                  const response = await fetch('/api/banner-cards');
                  if (!response.ok) throw new Error('Failed to fetch');
                  const cards = await response.json();
                  
                  // Make sure we're comparing strings consistently
                  const posValue = "${position}";
                  const card = cards.find(c => c.position === posValue);
                  
                  if (!card) {
                    console.log("No card found for position:", posValue);
                    return;
                  }
                  
                  const container = document.currentScript.parentElement;
                  
                  // Replace only inner content, not the whole container
                  const bgLayer = container.querySelector('div');
                  const titleEl = bgLayer.querySelector('h3');
                  const imgEl = container.querySelector('img');
                  
                  // Update content
                  titleEl.textContent = card.title;
                  imgEl.src = card.imageUrl;
                  imgEl.alt = card.title;
                  
                  // Update link wrapper
                  const linkWrapper = document.createElement('a');
                  linkWrapper.href = card.link;
                  
                  // Move container contents into link wrapper
                  while(container.firstChild) {
                    if (container.firstChild.nodeName !== 'SCRIPT') {
                      linkWrapper.appendChild(container.firstChild);
                    } else {
                      container.removeChild(container.firstChild);
                    }
                  }
                  
                  // Add link wrapper to container
                  container.appendChild(linkWrapper);
                  
                } catch (error) {
                  console.error("Failed to load banner card:", error);
                }
              })();
            `,
          }}
        />
      </div>
    </div>
  )
}

function BannerSkeleton() {
  return <Skeleton className="w-full h-32 md:h-48 rounded-lg" />
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
    </div>
  )
}

function ProductSliderSkeleton() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="w-44 flex-shrink-0">
            <Skeleton className="h-44 w-44 rounded-lg" />
            <Skeleton className="h-4 w-32 mt-2" />
            <Skeleton className="h-4 w-16 mt-1" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  )
}
