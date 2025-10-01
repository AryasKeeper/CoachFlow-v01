# Stabilization: Supabase Reality Audit

## Objective
Align codebase with current Supabase schema (Option B) and eliminate references to missing database objects.

## Changes Summary

### 1. Removed Missing RPC References ✅

**Status**: Already completed in codebase
- `search_coaches` RPC → Replaced with client-side query in `lib/database/query-optimizer.ts:162-228`
- `get_coach_availability` RPC → Replaced with client-side query in `lib/database/query-optimizer.ts:334-367`

**Why**: These RPCs do not exist in the current Supabase instance. The functionality was previously refactored to use client-side filtering and querying directly against tables.

### 2. Removed Missing View References ✅

**Status**: Already completed in codebase
- `applications_detailed` view → Now uses direct `applications` table query with joins in `lib/database/query-optimizer.ts:272-332`
- `table_performance_stats` view → Commented out (non-critical, lines 373-387)
- `slow_queries` view → Commented out (non-critical, lines 389-403)

**Why**: These views were planned but never deployed. The applications query was refactored to use the base table with manual joins. Performance monitoring views are not critical for app functionality.

### 3. Created Safe Query Helper ✅

**New File**: `lib/database/safe-query.ts`

Standardized helper function for all database queries:
```typescript
safeQuery<T>(queryFn, queryName, context): Promise<SafeQueryResult<T>>
```

**Features**:
- Uniform `{ data, error }` return type
- Automatic logging via `databaseLogger`
- Consistent error handling
- Performance tracking

**Benefits**:
- No more undefined/null confusion
- Centralized error logging
- Type-safe results
- Easier debugging

### 4. JSON Field Type Safety ✅

**New File**: `lib/database/json-helpers.ts`

Created type-safe parsers for all JSON fields with safe defaults:

| Field | Type | Default | Parser Function |
|-------|------|---------|----------------|
| `availability` | `AvailabilityData` | `{}` with sensible defaults | `parseAvailability()` |
| `dates` | `ListingDate[]` | `[]` | `parseListingDates()` |
| `time_intervals` | `TimeInterval[]` | `[]` | `parseTimeIntervals()` |
| `facility_features` | `string[]` | `[]` | `parseFacilityFeatures()` |
| `suburbs` | `string[]` | `[]` | `parseStringArray()` |
| `specialties` | `string[]` | `[]` | `parseStringArray()` |
| `required_badges` | `string[]` | `[]` | `parseStringArray()` |

**Updated Files**:
- `app/coach/settings/availability-settings.tsx` - Safe availability parsing
- `components/ui/listing-card.tsx` - Safe dates/time_intervals access
- `components/ui/animated-listing-card.tsx` - Safe dates/time_intervals access
- `app/org/listings/[id]/edit/edit-listing-form.tsx` - Array checks for JSON fields
- `app/org/profile/edit/org-profile-form.tsx` - Array check for facility_features

**Why**: JSON fields from Supabase are typed as `Json` which can be `null | undefined | ...`. Accessing properties directly causes TypeScript errors and runtime undefined behavior. Our helpers ensure:
- Type safety at compile time
- Safe defaults at runtime
- No more `Cannot read property 'X' of undefined` errors

### 5. Database Type Exports ✅

**Updated**: `lib/database/index.ts`

Now exports all database utilities in one place:
```typescript
// Query execution
export { safeQuery, queryOptimizer }

// JSON parsers
export { parseAvailability, parseListingDates, parseTimeIntervals, ... }

// Type definitions
export type { SafeQueryResult, AvailabilityData, ListingDate, ... }
```

### 6. TypeScript Validation ✅

**Command**: `npx tsc --noEmit`
**Result**: ✅ No type errors

All database-related type errors have been resolved. The codebase now typechecks cleanly.

## Database Schema Alignment

### Current Schema (Option B)

**Tables**:
- ✅ `users`
- ✅ `coach_profiles` (with `availability: Json`)
- ✅ `org_profiles` (with `facility_features: string[]`)
- ✅ `listings` (with `dates: Json`, `time_intervals: Json`, `suburbs: string[]`)
- ✅ `applications`
- ✅ `bookings`
- ✅ `messages`
- ✅ `subscriptions`

**Views**: None (empty)

**Functions/RPCs**: None (empty)

All code now queries tables directly. No references to missing views or RPCs remain.

## Migration Notes

### What We're NOT Deploying Today

Per the task specification, we are NOT deploying:
- Performance monitoring SQL (slow_queries, table_performance_stats views)
- Database RPCs/functions (search_coaches, get_coach_availability)

These are commented out but preserved in code for potential future deployment.

### Backward Compatibility

All changes are backward compatible:
- Existing data continues to work
- JSON fields gracefully handle `null`/`undefined`/missing keys
- No breaking changes to API contracts

## Testing Recommendations

Before merging to production:

1. **Verify JSON field handling**:
   - Test listings with missing `dates` or `time_intervals`
   - Test coach profiles with missing `availability`
   - Test org profiles with missing `facility_features`

2. **Verify query performance**:
   - Check that client-side queries are performant
   - Monitor for N+1 query issues
   - Validate pagination works correctly

3. **Verify error handling**:
   - Check logs show proper query context
   - Verify errors are caught and logged
   - Test error states in UI

## Exit Criteria Met ✅

- [x] No references to missing RPCs remain
- [x] No references to missing views remain  
- [x] All DB calls typecheck (`npx tsc --noEmit` passes)
- [x] JSON fields have safe defaults
- [x] Uniform error handling via `safeQuery`
- [x] PR branch created: `stabilization/supabase-reality`

## Files Changed

### New Files
- `lib/database/safe-query.ts` - Safe query wrapper
- `lib/database/json-helpers.ts` - JSON field parsers
- `STABILIZATION_SUMMARY.md` - This document

### Modified Files
- `lib/database/index.ts` - Export new utilities
- `lib/database/query-optimizer.ts` - Already using table queries (no RPCs)
- `app/coach/settings/availability-settings.tsx` - Safe availability parsing
- `components/ui/listing-card.tsx` - Safe JSON field access
- `app/org/listings/[id]/edit/edit-listing-form.tsx` - Array safety checks
- `app/org/profile/edit/org-profile-form.tsx` - Array safety checks
- `package.json` - Added TypeScript dev dependency

## Recommendations for Future

1. **Consider deploying RPCs**: Client-side filtering works but database-side RPCs would be more efficient for complex queries

2. **Add database indexes**: If performance becomes an issue, add indexes for:
   - `listings.status`
   - `listings.org_id`
   - `applications.coach_id`
   - `applications.listing_id`

3. **Consider database views**: For frequently joined data (like applications with listing/coach details), materialized views could improve performance

4. **Monitor query performance**: Use the `QueryMetrics` from query-optimizer to identify slow queries

5. **Add integration tests**: Test the JSON parsers and safeQuery helper with real Supabase data

---

**Branch**: `stabilization/supabase-reality`  
**Date**: October 1, 2025  
**Type**: Stabilization / Technical Debt  
**Breaking Changes**: None
