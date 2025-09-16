-- Performance optimization indexes for frequently queried tables
-- This migration adds indexes to improve query performance based on common access patterns

-- ============================================
-- LISTINGS TABLE INDEXES
-- ============================================

-- Index for active listings (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_listings_status 
  ON listings(status) 
  WHERE status = 'active';

-- Index for listing creation date (frequently ordered by)
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
  ON listings(created_at DESC);

-- Index for organization's listings
CREATE INDEX IF NOT EXISTS idx_listings_org_id 
  ON listings(org_id);

-- Index for urgency filtering
CREATE INDEX IF NOT EXISTS idx_listings_urgency 
  ON listings(urgency) 
  WHERE urgency IN ('urgent', 'soon');

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_listings_status_created 
  ON listings(status, created_at DESC);

-- ============================================
-- APPLICATIONS TABLE INDEXES
-- ============================================

-- Index for coach's applications
CREATE INDEX IF NOT EXISTS idx_applications_coach_id 
  ON applications(coach_id);

-- Index for listing's applications
CREATE INDEX IF NOT EXISTS idx_applications_listing_id 
  ON applications(listing_id);

-- Index for application status
CREATE INDEX IF NOT EXISTS idx_applications_status 
  ON applications(status);

-- Index for application creation date
CREATE INDEX IF NOT EXISTS idx_applications_created_at 
  ON applications(created_at DESC);

-- Composite index for coach's applications by status
CREATE INDEX IF NOT EXISTS idx_applications_coach_status 
  ON applications(coach_id, status);

-- ============================================
-- BOOKINGS TABLE INDEXES
-- ============================================

-- Index for organization's bookings
CREATE INDEX IF NOT EXISTS idx_bookings_org_id 
  ON bookings(org_id);

-- Index for coach's bookings
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id 
  ON bookings(coach_id);

-- Index for booking dates
CREATE INDEX IF NOT EXISTS idx_bookings_start_at 
  ON bookings(start_at);

CREATE INDEX IF NOT EXISTS idx_bookings_end_at 
  ON bookings(end_at);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
  ON bookings(start_at, end_at);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- Index for user's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

-- Index for notification creation date
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, read_at) 
  WHERE read_at IS NULL;

-- Composite index for user's notifications by date
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

-- Index for sender's messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
  ON messages(sender_id);

-- Index for receiver's messages
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id 
  ON messages(receiver_id);

-- Index for thread-based queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_id 
  ON messages(thread_id) 
  WHERE thread_id IS NOT NULL;

-- Index for message creation date
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON messages(created_at DESC);

-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(sender_id, receiver_id, created_at DESC);

-- ============================================
-- COACH_PROFILES TABLE INDEXES
-- ============================================

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verified 
  ON coach_profiles(is_verified) 
  WHERE is_verified = true;

-- Index for coach availability
CREATE INDEX IF NOT EXISTS idx_coach_profiles_available 
  ON coach_profiles(is_available) 
  WHERE is_available = true;

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for user roles
CREATE INDEX IF NOT EXISTS idx_users_role 
  ON users(role);

-- Index for user email (if not already primary key)
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update statistics for the query planner
ANALYZE listings;
ANALYZE applications;
ANALYZE bookings;
ANALYZE notifications;
ANALYZE messages;
ANALYZE coach_profiles;
ANALYZE users;

-- ============================================
-- PERFORMANCE NOTES
-- ============================================
-- These indexes are designed based on common query patterns:
-- 1. Filtering by status (active listings, pending applications)
-- 2. Ordering by creation date (most recent first)
-- 3. Filtering by user relationships (org_id, coach_id, user_id)
-- 4. Date range queries (bookings)
-- 5. Unread notifications filtering
-- 
-- Monitor query performance with:
-- EXPLAIN ANALYZE <your query>;
-- 
-- Check index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;