# Application Withdrawal Fix Instructions

## Problem
The withdraw application feature is failing because there's no RLS (Row Level Security) policy allowing coaches to DELETE their own applications from the database.

## Solution Options

### Option 1: Enable Deletion (Recommended)
Apply the deletion policy to allow coaches to delete their pending applications.

1. **Go to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL:**

```sql
-- Add DELETE policy for coaches to withdraw their own applications
CREATE POLICY "Coaches can delete their own applications"
  ON public.applications
  FOR DELETE
  USING (auth.uid() = coach_id);

-- Grant delete permission to authenticated users
GRANT DELETE ON public.applications TO authenticated;
```

### Option 2: Use Status Update Instead (Alternative)
If deletion causes issues with foreign keys (message_threads), use status update instead.

1. **Update the database** to add 'withdrawn' status:

```sql
-- Add 'withdrawn' as a valid status
ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));
```

2. **Update the withdrawal handler** in `application-card.tsx`:

Replace the delete operation with:
```typescript
const { error } = await supabase
  .from('applications')
  .update({ status: 'withdrawn' })
  .eq('id', application.id)
```

3. **Filter withdrawn applications** in `app/coach/applications/page.tsx`:

Add filtering to exclude withdrawn applications:
```typescript
const { data: applications } = await supabase
  .from('applications')
  .select(/* ... */)
  .eq('coach_id', user.id)
  .neq('status', 'withdrawn')  // Hide withdrawn applications
  .order('created_at', { ascending: false })
```

## Testing Steps

1. Apply one of the solutions above to your Supabase database
2. Refresh your application
3. Try withdrawing an application
4. Check browser console for any error messages
5. Verify the application is removed from the list

## What Was Wrong

- The database had policies for SELECT, INSERT, and UPDATE operations on applications
- But there was NO DELETE policy
- When the coach tried to delete their application, Supabase blocked it due to RLS
- The error was silent because RLS violations don't always return clear error messages

## Current Implementation

The improved error handling now:
- Logs the application ID being withdrawn
- Provides specific error messages for different failure types
- Shows the actual Supabase error message if available
- Properly closes the dialog and refreshes the page on success

## Notes

- Option 1 (deletion) is cleaner but might fail if there are message threads linked to the application
- Option 2 (status update) preserves data integrity and audit trail
- Both options are valid depending on your business requirements