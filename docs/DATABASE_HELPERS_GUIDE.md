# Database Helpers Usage Guide

This guide explains how to use the new database helper utilities for type-safe Supabase queries.

## Quick Start

```typescript
import { 
  safeQuery, 
  parseAvailability, 
  parseListingDates,
  parseTimeIntervals 
} from '@/lib/database'
```

## Safe Query Wrapper

Use `safeQuery` for all database operations to get consistent error handling and logging.

### Basic Usage

```typescript
import { safeQuery } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const result = await safeQuery(
  async () => {
    return await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
  },
  'get_active_listings',
  { userId: user.id } // optional context for logging
)

if (result.error) {
  console.error('Query failed:', result.error)
  return
}

const listings = result.data
```

### Benefits

- ✅ Consistent `{ data, error }` return type
- ✅ Automatic error logging with context
- ✅ Performance tracking
- ✅ Type-safe results

## JSON Field Parsers

All JSON fields from Supabase should be parsed using type-safe helpers.

### Availability Data

```typescript
import { parseAvailability } from '@/lib/database'

// In your component
const profile = await getCoachProfile(userId)
const availability = parseAvailability(profile.availability)

// Now safely use with defaults:
console.log(availability.days) // string[] - never undefined
console.log(availability.slots) // string[] - never undefined
console.log(availability.minimum_notice) // string - defaults to '24 hours'
```

### Listing Dates

```typescript
import { parseListingDates } from '@/lib/database'

const listing = await getListing(listingId)
const dates = parseListingDates(listing.dates)

// Always returns ListingDate[] - never null/undefined
dates.forEach(date => {
  console.log(date.start_date) // string
  console.log(date.end_date) // string | undefined
})
```

### Time Intervals

```typescript
import { parseTimeIntervals } from '@/lib/database'

const listing = await getListing(listingId)
const intervals = parseTimeIntervals(listing.time_intervals)

// Always returns TimeInterval[] - never null/undefined
intervals.forEach(interval => {
  console.log(interval.id) // string
  console.log(interval.startTime) // string (format: "HH:mm")
  console.log(interval.endTime) // string (format: "HH:mm")
})
```

### String Arrays

```typescript
import { parseStringArray } from '@/lib/database'

const listing = await getListing(listingId)

const suburbs = parseStringArray(listing.suburbs) // string[]
const badges = parseStringArray(listing.required_badges) // string[]
const features = parseStringArray(profile.facility_features) // string[]
```

## Complete Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { 
  safeQuery, 
  parseListingDates, 
  parseTimeIntervals,
  parseStringArray 
} from '@/lib/database'
import { createClient } from '@/lib/supabase/client'

export function ListingDetails({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    async function fetchListing() {
      const supabase = createClient()
      
      const result = await safeQuery(
        async () => {
          return await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single()
        },
        'get_listing_details',
        { listingId }
      )
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      setListing(result.data)
    }
    
    fetchListing()
  }, [listingId])
  
  if (error) return <div>Error: {error.message}</div>
  if (!listing) return <div>Loading...</div>
  
  // Parse JSON fields safely
  const dates = parseListingDates(listing.dates)
  const intervals = parseTimeIntervals(listing.time_intervals)
  const suburbs = parseStringArray(listing.suburbs)
  
  return (
    <div>
      <h1>{listing.title}</h1>
      
      <div>
        <h2>Dates</h2>
        {dates.length > 0 ? (
          dates.map((date, i) => (
            <div key={i}>{date.start_date}</div>
          ))
        ) : (
          <div>No dates specified</div>
        )}
      </div>
      
      <div>
        <h2>Time Slots</h2>
        {intervals.length > 0 ? (
          intervals.map(slot => (
            <div key={slot.id}>
              {slot.startTime} - {slot.endTime}
            </div>
          ))
        ) : (
          <div>No time slots specified</div>
        )}
      </div>
      
      <div>
        <h2>Locations</h2>
        {suburbs.length > 0 ? (
          suburbs.map(suburb => (
            <div key={suburb}>{suburb}</div>
          ))
        ) : (
          <div>No locations specified</div>
        )}
      </div>
    </div>
  )
}
```

## Saving JSON Data

When saving back to the database, use the conversion helpers:

```typescript
import { toJsonArray, toJsonObject } from '@/lib/database'

// Save dates
const dates = [
  { start_date: '2025-10-15', end_date: '2025-10-16' }
]

await supabase
  .from('listings')
  .update({ 
    dates: toJsonArray(dates),
    time_intervals: toJsonArray(intervals),
    suburbs: suburbs // string[] works directly
  })
  .eq('id', listingId)
```

## Migration from Old Code

### Before (Unsafe ❌)

```typescript
// Can throw "Cannot read property 'days' of undefined"
const days = profile.availability?.days || []

// Can throw "Cannot read property 'length' of null"
if (listing.dates && listing.dates.length > 0) {
  // ...
}
```

### After (Safe ✅)

```typescript
import { parseAvailability, parseListingDates } from '@/lib/database'

// Always returns array - never undefined
const availability = parseAvailability(profile.availability)
const days = availability.days // string[]

// Always returns array - never null/undefined
const dates = parseListingDates(listing.dates)
if (dates.length > 0) {
  // ...
}
```

## Type Definitions

All types are exported from `@/lib/database`:

```typescript
import type { 
  SafeQueryResult,
  AvailabilityData,
  ListingDate,
  TimeInterval 
} from '@/lib/database'

// Use in your component types
interface Props {
  availability: AvailabilityData
  dates: ListingDate[]
  intervals: TimeInterval[]
}
```

## Best Practices

1. **Always use parsers for JSON fields**
   - Never access JSON fields directly
   - Always use the appropriate parser function

2. **Use safeQuery for new queries**
   - Provides consistent error handling
   - Automatic logging helps debugging

3. **Check array length, not truthiness**
   ```typescript
   // Good ✅
   if (dates.length > 0) { ... }
   
   // Bad ❌ (parsers always return array, so always truthy)
   if (dates) { ... }
   ```

4. **Type your components**
   ```typescript
   // Good ✅
   interface Props {
     intervals: TimeInterval[]
   }
   
   // Bad ❌
   interface Props {
     intervals: any
   }
   ```

## Troubleshooting

### "Cannot find module '@/lib/database'"

Make sure you're importing from the database index:
```typescript
import { safeQuery } from '@/lib/database'
// NOT: import { safeQuery } from '@/lib/database/safe-query'
```

### "Type 'Json' is not assignable to..."

Use the appropriate parser:
```typescript
// Wrong ❌
const dates: ListingDate[] = listing.dates

// Right ✅
const dates = parseListingDates(listing.dates)
```

### "Property 'X' does not exist on type 'never'"

Make sure you're using the parsed result:
```typescript
// Wrong ❌
const dates = listing.dates
dates.forEach(...) // Error!

// Right ✅
const dates = parseListingDates(listing.dates)
dates.forEach(...) // Works!
```

## Questions?

See `STABILIZATION_SUMMARY.md` for more details on the migration.
