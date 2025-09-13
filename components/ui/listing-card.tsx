import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, DollarSign } from "lucide-react"
// Removed date-fns to fix Jest worker error

type ListingDate = {
  start_date: string
  end_date?: string
}

type TimeInterval = {
  id: string
  startTime: string
  endTime: string
}

interface ListingCardProps {
  listing: {
    id: string
    title: string
    description: string | null
    location: string
    suburbs: string[]
    dates: ListingDate | ListingDate[] | null
    time_intervals: TimeInterval[] | null
    pay_min: number | null
    pay_max: number | null
    urgency: string | null
    gender_preference: string | null
    status: string
    created_at: string
    org?: {
      org_name: string
    }
  }
  onClick?: () => void
  className?: string
}

export function ListingCard({ listing, onClick, className }: ListingCardProps) {
  const getUrgencyBadge = () => {
    if (!listing.urgency) return null
    
    const urgencyColors = {
      urgent: "bg-red-500/10 text-red-700 border-red-200",
      soon: "bg-orange-500/10 text-orange-700 border-orange-200",
      flexible: "bg-green-500/10 text-green-700 border-green-200"
    }
    
    return (
      <Badge className={cn("ml-auto", urgencyColors[listing.urgency as keyof typeof urgencyColors])}>
        {listing.urgency}
      </Badge>
    )
  }
  
  const formatPayRange = () => {
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
    <GlassCard
      className={cn(
        "cursor-pointer transition-all hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{listing.title}</h3>
            {listing.org && (
              <p className="text-sm text-muted-foreground mt-1">
                {listing.org.org_name}
              </p>
            )}
          </div>
          {getUrgencyBadge()}
        </div>
        
        {listing.description && (
          <p className="text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{formatSuburbs()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{formatPayRange()}</span>
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
        </div>
        
        <div className={cn(
          "flex items-center justify-between pt-3 border-t",
          listing.status === "active" ? "border-green-200" : "border-border"
        )}>
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
        </div>
      </div>
    </GlassCard>
  )
}
