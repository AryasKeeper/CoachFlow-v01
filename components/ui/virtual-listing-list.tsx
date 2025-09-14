"use client"

import { FixedVirtualList } from './virtual-list'
import { AnimatedListingCard } from './animated-listing-card'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface VirtualListingListProps {
  listings: any[]
  containerHeight?: number
  itemHeight?: number
}

export function VirtualListingList({
  listings,
  containerHeight = 600,
  itemHeight = 200
}: VirtualListingListProps) {
  const router = useRouter()

  const renderListing = (listing: any, index: number) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="px-4 py-2"
    >
      <AnimatedListingCard
        listing={listing}
        onClick={() => router.push(`/coach/listings/${listing.id}`)}
        index={0} // Use 0 to avoid stagger delays in virtual list
      />
    </motion.div>
  )

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <FixedVirtualList
        items={listings}
        itemHeight={itemHeight}
        renderItem={renderListing}
        containerHeight={containerHeight}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        overscan={2}
      />
    </div>
  )
}