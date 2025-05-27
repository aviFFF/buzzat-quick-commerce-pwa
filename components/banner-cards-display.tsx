"use client"

import { useEffect, useState } from "react"
import BannerCard, { BannerCardProps } from "./banner-card"
import { Skeleton } from "@/components/ui/skeleton"

interface BannerCardsDisplayProps {
  position?: 'top' | 'middle' | 'bottom'
}

export default function BannerCardsDisplay({ position }: BannerCardsDisplayProps) {
  const [bannerCards, setBannerCards] = useState<BannerCardProps[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBannerCards() {
      try {
        const response = await fetch('/api/banner-cards')
        if (!response.ok) throw new Error('Failed to fetch banner cards')
        const data = await response.json()
        setBannerCards(data)
      } catch (error) {
        console.error('Error fetching banner cards:', error)
        // Use fallback data if API fails
        setBannerCards([
          {
            id: '1',
            title: 'Fresh Fruits & Vegetables',
            imageUrl: 'https://images.unsplash.com/photo-1521566652839-697aa473761a',
            link: '/category/fruits-vegetables',
            position: 'top'
          },
          {
            id: '2',
            title: 'Dairy Products',
            imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da',
            link: '/category/dairy-bread-eggs',
            position: 'middle'
          },
          {
            id: '3',
            title: 'Grocery & Staples',
            imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818',
            link: '/category/grocery',
            position: 'bottom'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchBannerCards()
  }, [])

  if (loading) {
    return position ? <PositionSkeleton position={position} /> : <CardsSkeleton />
  }

  // For desktop view, always show all banners
  if (!position) {
  return (
      <div className="hidden md:flex gap-4 my-6">
        {bannerCards.map(card => (
          <BannerCard 
            key={card.id}
            title={card.title}
            imageUrl={card.imageUrl}
            link={card.link}
            className="flex-1"
          />
        ))}
      </div>
    )
  }

  // For mobile view, show only the banner at the specified position
  const card = bannerCards.find(card => card.position === position)
  
  if (!card) return null

  return (
    <div className={`md:${position === 'top' ? 'hidden' : 'flex'} my-6`}>
      {position === 'top' ? (
        // For top position, visible on both mobile and desktop
        <>
          {/* Desktop: all banners */}
          <div className="hidden md:flex gap-4">
        {bannerCards.map(card => (
          <BannerCard 
            key={card.id}
            title={card.title}
            imageUrl={card.imageUrl}
            link={card.link}
            className="flex-1"
          />
        ))}
      </div>

          {/* Mobile: only top banner */}
      <div className="md:hidden">
            <BannerCard
              title={card.title}
              imageUrl={card.imageUrl}
              link={card.link}
            />
          </div>
        </>
      ) : (
        // For middle and bottom positions, only visible on mobile
        <div className="md:hidden">
          <BannerCard
            title={card.title}
            imageUrl={card.imageUrl}
            link={card.link}
            />
          </div>
        )}
    </div>
  )
}

function PositionSkeleton({ position }: { position: string }) {
  if (position === 'top') {
    return (
      <>
        {/* Desktop skeleton - all banners */}
        <div className="hidden md:flex gap-4 mb-6">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[21/9] rounded-lg" />
          ))}
      </div>

        {/* Mobile skeleton - only top banner */}
        <div className="md:hidden mb-6">
          <Skeleton className="w-full aspect-[16/9] rounded-lg" />
        </div>
      </>
    )
  }
  
  // Middle and bottom skeletons - only on mobile
  return (
    <div className="md:hidden mb-6">
      <Skeleton className="w-full aspect-[16/9] rounded-lg" />
    </div>
  )
}

function CardsSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
    <div className="hidden md:flex gap-4 mb-6">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[21/9] rounded-lg" />
      ))}
    </div>
      
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-6 mb-6">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[16/9] rounded-lg" />
        ))}
      </div>
    </>
  )
} 