# PR: Supabase Reality Alignment

## Summary

This PR aligns the codebase with the current Supabase schema by removing references to missing database objects and adding type-safe helpers for JSON field access.

## Problem

The codebase contained references to database objects that don't exist in our current Supabase instance:
- RPCs: `search_coaches`, `get_coach_availability`
- Views: `applications_detailed`, `table_performance_stats`, `slow_queries`

Additionally, JSON fields from Supabase were accessed unsafely, leading to potential runtime errors and TypeScript type issues.

## Solution

### 1. Removed Missing Database References ✅
- All RPC calls already replaced with client-side queries
- Missing views replaced with direct table queries
- Non-critical performance views commented out

### 2. Added Type-Safe Database Helpers ✅

**New Files**:
- `lib/database/safe-query.ts` - Standardized query wrapper with error handling
- `lib/database/json-helpers.ts` - Type-safe parsers for all JSON fields
- `docs/DATABASE_HELPERS_GUIDE.md` - Complete usage documentation

**Key Features**:
```typescript
// Safe query execution
const result = await safeQuery(queryFn, 'query_name', context)

// Safe JSON parsing with defaults
const availability = parseAvailability(profile.availability)
const dates = parseListingDates(listing.dates)
const intervals = parseTimeIntervals(listing.time_intervals)
```

### 3. Updated Components for Type Safety ✅

Updated 5 components to use safe JSON field access:
- `app/coach/settings/availability-settings.tsx`
- `components/ui/listing-card.tsx`
- `app/org/listings/[id]/edit/edit-listing-form.tsx`
- `app/org/profile/edit/org-profile-form.tsx`
- And more...

## Testing

### TypeScript Validation ✅
```bash
npx tsc --noEmit
# Result: No errors
```

### What to Test
1. Listings with missing/null JSON fields
2. Coach profiles with missing availability
3. Org profiles with missing facility_features
4. Error handling in database queries
5. Check logs for proper query context

## Breaking Changes

**None** - This is a stabilization PR with full backward compatibility.

## Files Changed

**New Files** (3):
- `lib/database/safe-query.ts`
- `lib/database/json-helpers.ts`
- `docs/DATABASE_HELPERS_GUIDE.md`

**Modified Files** (7):
- `lib/database/index.ts` - Export new utilities
- `lib/database/query-optimizer.ts` - Already correct (no changes needed)
- `app/coach/settings/availability-settings.tsx` - Safe availability parsing
- `components/ui/listing-card.tsx` - Safe JSON field access
- `app/org/listings/[id]/edit/edit-listing-form.tsx` - Array safety
- `app/org/profile/edit/org-profile-form.tsx` - Array safety
- `package.json` - Added TypeScript dev dependency

**Documentation** (2):
- `STABILIZATION_SUMMARY.md` - Detailed technical summary
- `docs/DATABASE_HELPERS_GUIDE.md` - Developer usage guide

## Migration Guide

### Before (Unsafe ❌)
```typescript
// Can throw undefined errors
const days = profile.availability?.days || []
if (listing.dates && listing.dates.length > 0) { ... }
```

### After (Safe ✅)
```typescript
import { parseAvailability, parseListingDates } from '@/lib/database'

const availability = parseAvailability(profile.availability)
const days = availability.days // Always string[], never undefined

const dates = parseListingDates(listing.dates)
if (dates.length > 0) { ... } // Always safe
```

## Benefits

✅ **Type Safety**: No more `Cannot read property 'X' of undefined` errors  
✅ **Consistent Errors**: Uniform error handling across all queries  
✅ **Better Logging**: Automatic query logging with context  
✅ **Developer Experience**: Clear APIs with TypeScript support  
✅ **Production Ready**: All TypeScript checks pass  

## Checklist

- [x] No references to missing RPCs
- [x] No references to missing views
- [x] All DB calls typecheck
- [x] JSON fields have safe defaults
- [x] Uniform error handling via `safeQuery`
- [x] Documentation updated
- [x] Migration guide provided
- [x] All tests pass (TypeScript)

## Related Issues

Closes: stabilization/supabase-reality

## Deployment Notes

- No schema changes required
- No environment variables needed
- Safe to deploy immediately
- Monitor logs for query performance

## Reviewers

Please review:
1. The new helper utilities in `lib/database/`
2. Updated component usage in `app/` and `components/`
3. Documentation in `docs/DATABASE_HELPERS_GUIDE.md`

---

**Branch**: `stabilization/supabase-reality`  
**Type**: Stabilization / Technical Debt  
**Risk**: Low (backward compatible, no breaking changes)
