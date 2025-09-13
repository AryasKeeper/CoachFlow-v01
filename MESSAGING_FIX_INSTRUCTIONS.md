# Messaging System Fix Instructions

## Problem Summary
The messaging functionality isn't working because:
1. The database tables for the new messaging system haven't been created
2. The message pages are trying to query tables that don't exist yet
3. The RPC function `get_or_create_message_thread` doesn't exist in the database

## Solution Steps

### Step 1: Apply Database Migration
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file `supabase/setup_messaging.sql` that was just created
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click "Run" to execute the script

This will:
- Create the `message_threads` table
- Create the new `messages` table structure
- Create the `message_notifications` table
- Set up all necessary indexes and RLS policies
- Create the `get_or_create_message_thread` function
- Enable realtime for messaging

### Step 2: Verify the Setup
After running the script, verify by running this query in SQL Editor:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('message_threads', 'messages', 'message_notifications');

-- Check if function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_or_create_message_thread';
```

### Step 3: Test the Messaging Flow
1. **As a Coach:**
   - Go to a listing
   - Apply with a message
   - Check that application is created

2. **As an Organization:**
   - Go to Messages page
   - You should see the new message thread
   - The coach's message should be visible
   - You should be able to reply

### What the Fix Does

#### Database Structure
- **message_threads**: Stores conversation threads between coaches and orgs
- **messages**: Stores individual messages within threads
- **message_notifications**: Tracks unread counts per user per thread

#### Key Features
- Automatic thread creation when coach applies with message
- Real-time message updates using Supabase Realtime
- Unread message counts
- RLS policies ensure users only see their own messages
- Automatic notification creation for recipients

#### Flow
1. Coach applies to listing with message
2. System calls `get_or_create_message_thread(application_id)`
3. Thread is created linking coach and org
4. Message is inserted into thread
5. Notification is created for org
6. Org sees notification and new message in Messages page
7. Both parties can continue conversation in real-time

### Troubleshooting

If messages still don't appear:
1. Check browser console for errors
2. Verify the coach_id and org_id are correct in applications table
3. Check that RLS is enabled but policies allow access
4. Ensure the user is authenticated when querying

### Code Changes Made
1. Fixed `app/org/messages/page.tsx` to query using `org_id` instead of `participant_ids`
2. Fixed the application submission to use correct function parameters
3. Created comprehensive database setup script

## Next Steps
After applying the database migration, the messaging system should work properly. Test by:
1. Creating a new application with a message
2. Checking the org's messages page
3. Sending replies back and forth