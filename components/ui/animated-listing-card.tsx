"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, DollarSign, ChevronRight } from "lucide-react"
import { Listing } from "@/lib/react-query/hooks/use-listings"

interface AnimatedListingCardProps {
  listing: Listing & { org?: any }
  onClick?: () => void
  className?: string
  index?: number
}

export function AnimatedListingCard({ listing, onClick, className, index = 0 }: AnimatedListingCardProps) {
  const getUrgencyBadge = () => {
    if (!listing.urgency) return null

    const urgencyColors = {
      urgent: "bg-red-500/10 text-red-700 border-red-200",
      soon: "bg-orange-500/10 text-orange-700 border-orange-200",
      flexible: "bg-green-500/10 text-green-700 border-green-200"
    }

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 20 }}
      >
        <Badge className={cn("ml-auto", urgencyColors[listing.urgency as keyof typeof urgencyColors])}>
          {listing.urgency}
        </Badge>
      </motion.div>
    )
  }

  const formatPayRange = () => {
    // First check if we have pay_details string
    if (listing.pay_details) return listing.pay_details

    // Otherwise use min/max
    if (!listing.pay_min && !listing.pay_max) return "Rate negotiable"
    if (listing.pay_min && listing.pay_max) {
      return `$${listing.pay_min} - $${listing.pay_max}/hr`
    }
    if (listing.pay_min) return `From $${listing.pay_min}/hr`
    return `Up to $${listing.pay_max}/hr`
  }

  const formatTimeDisplay = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(':')
    const hour24 = parseInt(hours)
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatTimeIntervals = () => {
    if (!listing.time_intervals || listing.time_intervals.length === 0) return "Times TBD"

    if (listing.time_intervals.length === 1) {
      const interval = listing.time_intervals[0]
      return `${formatTimeDisplay(interval.startTime)} - ${formatTimeDisplay(interval.endTime)}`
    }

    return `${listing.time_intervals.length} time slots`
  }

  const formatSuburbs = () => {
    if (!listing.suburbs || listing.suburbs.length === 0) {
      return listing.location || "Location TBD"
    }

    if (listing.suburbs.length === 1) {
      return listing.suburbs[0]
    }

    if (listing.suburbs.length <= 2) {
      return listing.suburbs.join(" & ")
    }

    return `${listing.suburbs[0]} +${listing.suburbs.length - 1} more`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.02, 0.1), // Max 100ms delay
        duration: 0.3, // Faster animation
        ease: [0.16, 1, 0.3, 1] as const // Apple's easing curve
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard
        className={cn(
          "cursor-pointer transition-all hover:shadow-xl relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
          className
        )}
        onClick={onClick}
      >
        <motion.div
          className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ x: -10, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <h3 className="text-xl font-semibold">{listing.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Organization
              </p>
            </motion.div>
            {getUrgencyBadge()}
          </div>

          {listing.description && (
            <motion.p
              className="text-muted-foreground line-clamp-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
            >
              {listing.description}
            </motion.p>
          )}

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{formatSuburbs()}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-green-600">{formatPayRange()}</span>
            </div>

            {listing.dates && Array.isArray(listing.dates) && listing.dates.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {listing.dates.length === 1
                    ? (() => {
                        try {
                          const date = new Date(listing.dates[0].start_date)
                          return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD"
                        } catch {
                          return "Date TBD"
                        }
                      })()
                    : `${listing.dates.length} dates`
                  }
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTimeIntervals()}</span>
            </div>
          </motion.div>

          <motion.div
            className={cn(
              "flex items-center justify-between pt-3 border-t",
              listing.status === "active" ? "border-green-200" : "border-border"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            <div className="flex items-center gap-2">
              <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                {listing.status}
              </Badge>
              {listing.gender_preference && listing.gender_preference !== 'no-preference' && (
                <Badge variant="outline" className="text-xs">
                  {listing.gender_preference === 'male' && '♂ Male coach preferred'}
                  {listing.gender_preference === 'female' && '♀ Female coach preferred'}
                  {listing.gender_preference === 'non-binary' && '⚧ Non-binary coach preferred'}
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  )
}