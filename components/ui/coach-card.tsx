import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import { BadgeRow } from "./badge-row"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Car, Star } from "lucide-react"

interface CoachCardProps {
  coach: {
    id: string
    name: string | null
    bio: string | null
    specialties: string[]
    suburbs: string[]
    rate_hourly: number | null
    rate_flat: number | null
    travel_km: number | null
    rating_avg: number | null
    rating_count: number
    wwcc_number: string | null
    wwcc_expiry: string | null
    insurance_url: string | null
    first_aid_url: string | null
  }
  onClick?: () => void
  className?: string
}

export function CoachCard({ coach, onClick, className }: CoachCardProps) {
  const badges = [
    {
      label: "WWCC",
      status: coach.wwcc_number ? "verified" : "not-provided"
    },
    {
      label: "Insurance",
      status: coach.insurance_url ? "verified" : "not-provided"
    },
    {
      label: "First Aid",
      status: coach.first_aid_url ? "verified" : "not-provided"
    },
  ] as const
  
  const formatRate = () => {
    if (coach.rate_hourly && coach.rate_flat) {
      return `$${coach.rate_hourly}/hr or $${coach.rate_flat} flat`
    }
    if (coach.rate_hourly) return `$${coach.rate_hourly}/hr`
    if (coach.rate_flat) return `$${coach.rate_flat} flat rate`
    return "Rate negotiable"
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
            <h3 className="text-xl font-semibold">{coach.name || "Basketball Coach"}</h3>
            {coach.rating_avg && coach.rating_count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">{coach.rating_avg.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({coach.rating_count})</span>
              </div>
            )}
          </div>
        </div>
        
        {coach.bio && (
          <p className="text-muted-foreground line-clamp-2">
            {coach.bio}
          </p>
        )}
        
        <div className="space-y-3">
          {coach.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coach.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>{formatRate()}</span>
            </div>
            
            {coach.travel_km && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="w-4 h-4" />
                <span>Travels up to {coach.travel_km}km</span>
              </div>
            )}
            
            {coach.suburbs.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-full">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">
                  {coach.suburbs.slice(0, 3).join(", ")}
                  {coach.suburbs.length > 3 && ` +${coach.suburbs.length - 3} more`}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <BadgeRow badges={badges} />
        </div>
      </div>
    </GlassCard>
  )
}
