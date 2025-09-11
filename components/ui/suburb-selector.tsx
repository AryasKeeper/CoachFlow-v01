"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, X } from "lucide-react"

const SYDNEY_SUBURBS_BY_REGION = {
  "Inner City": [
    "Alexandria", "Chippendale", "Darlinghurst", "Glebe", "Potts Point", 
    "Redfern", "Surry Hills", "Sydney CBD", "Ultimo", "Waterloo"
  ],
  "Eastern Suburbs": [
    "Bondi", "Bondi Junction", "Bronte", "Clovelly", "Coogee",
    "Maroubra", "Paddington", "Randwick"
  ],
  "Inner West": [
    "Annandale", "Ashfield", "Dulwich Hill", "Erskineville", "Leichhardt",
    "Lilyfield", "Marrickville", "Newtown", "Petersham", "Rozelle", "Summer Hill"
  ],
  "North Shore": [
    "Artarmon", "Chatswood", "Crows Nest", "Lane Cove", "Mosman",
    "Neutral Bay", "North Sydney", "Willoughby", "Wollstonecraft"
  ],
  "Northern Beaches": [
    "Brookvale", "Collaroy", "Dee Why", "Manly", "Narrabeen", "Palm Beach"
  ],
  "Western Sydney": [
    "Auburn", "Bankstown", "Blacktown", "Granville", "Homebush",
    "Lidcombe", "Mount Druitt", "Parramatta", "Penrith", "Rooty Hill",
    "Strathfield", "Westmead"
  ],
  "South West Sydney": [
    "Campbelltown", "Casula", "Fairfield", "Hoxton Park", "Ingleburn",
    "Liverpool", "Punchbowl", "Revesby", "Wetherill Park"
  ],
  "Southern Sydney & St George": [
    "Brighton-Le-Sands", "Canterbury", "Hurstville", "Kogarah", 
    "Rockdale", "Sans Souci"
  ],
  "Sutherland Shire": [
    "Cronulla", "Engadine", "Gymea", "Menai", "Miranda", "Sutherland"
  ],
  "Greater Ryde & Macquarie": [
    "Macquarie Park", "Meadowbank", "Ryde"
  ],
  "Emerging/Edge Suburbs": [
    "Concord", "Drummoyne", "Five Dock", "Rhodes", "Wentworth Point"
  ]
}

// Flatten all suburbs for autocomplete
const SYDNEY_SUBURBS = Object.values(SYDNEY_SUBURBS_BY_REGION).flat().sort()

interface SuburbSelectorProps {
  value: string[]
  onChange: (suburbs: string[]) => void
  label?: string
  placeholder?: string
  maxSuburbs?: number
  required?: boolean
  error?: string
  description?: string
}

export function SuburbSelector({
  value = [],
  onChange,
  label = "Suburbs",
  placeholder = "Search suburbs...",
  maxSuburbs = 5,
  required = false,
  error,
  description
}: SuburbSelectorProps) {
  const [searchFilter, setSearchFilter] = useState("")
  const [expandedRegions, setExpandedRegions] = useState<string[]>(["Inner City", "Eastern Suburbs"])

  const toggleSuburb = (suburb: string) => {
    if (value.includes(suburb)) {
      onChange(value.filter(s => s !== suburb))
    } else if (value.length < maxSuburbs) {
      onChange([...value, suburb])
    }
  }

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
  }

  const getFilteredRegions = () => {
    if (!searchFilter) return SYDNEY_SUBURBS_BY_REGION

    const filtered: Record<string, string[]> = {}
    Object.entries(SYDNEY_SUBURBS_BY_REGION).forEach(([region, suburbs]) => {
      const matchingSuburbs = suburbs.filter(suburb =>
        suburb.toLowerCase().includes(searchFilter.toLowerCase())
      )
      if (matchingSuburbs.length > 0) {
        filtered[region] = matchingSuburbs
      }
    })
    return filtered
  }

  const filteredRegions = getFilteredRegions()

  return (
    <div className="space-y-4">
      <div>
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-10"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>

      {/* Selected Suburbs */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Areas</span>
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxSuburbs}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((suburb) => (
              <Badge key={suburb} variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {suburb}
                <button
                  type="button"
                  onClick={() => toggleSuburb(suburb)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Region-based Checkbox Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
        {Object.entries(filteredRegions).map(([region, suburbs]) => (
          <div key={region} className="space-y-2">
            <button
              type="button"
              onClick={() => toggleRegion(region)}
              className="flex items-center justify-between w-full text-left font-medium text-sm hover:text-primary"
            >
              <span>{region}</span>
              <span className="text-xs text-muted-foreground">
                {suburbs.filter(s => value.includes(s)).length}/{suburbs.length}
              </span>
            </button>
            
            {expandedRegions.includes(region) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                {suburbs.map((suburb) => (
                  <label
                    key={suburb}
                    className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-muted/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(suburb)}
                      onChange={() => toggleSuburb(suburb)}
                      disabled={!value.includes(suburb) && value.length >= maxSuburbs}
                      className="rounded border-border"
                    />
                    <span className={value.includes(suburb) ? "font-medium" : ""}>
                      {suburb}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}