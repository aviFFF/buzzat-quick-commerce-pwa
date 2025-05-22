"use client"

import { useEffect, useState } from "react"
import BannerCard, { BannerCardProps } from "./banner-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function BannerCardsDisplay() {
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
    return <CardsSkeleton />
  }

  const topCard = bannerCards.find(card => card.position === 'top')
  const middleCard = bannerCards.find(card => card.position === 'middle')
  const bottomCard = bannerCards.find(card => card.position === 'bottom')

  return (
    <>
      {/* Desktop View: All cards in flex row above categories */}
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

      {/* Mobile View: Cards at different positions */}
      <div className="md:hidden">
        {/* Top card (above categories) */}
        {topCard && (
          <div className="mb-6">
            <BannerCard
              title={topCard.title}
              imageUrl={topCard.imageUrl}
              link={topCard.link}
            />
          </div>
        )}
      </div>

      {/* Middle card placeholder - will be rendered in page.tsx */}
      {/* Bottom card placeholder - will be rendered in page.tsx */}
    </>
  )
}

function CardsSkeleton() {
  return (
    <div className="hidden md:flex gap-4 mb-6">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[21/9] rounded-lg" />
      ))}
    </div>
  )
} 