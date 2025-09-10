-- Database Performance Optimizations for CoachFlow
-- These optimizations improve query performance and add proper indexing

-- =====================================================
-- 1. Additional Indexes for Common Query Patterns
-- =====================================================

-- Composite indexes for multi-column queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_status_created_at ON public.listings(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_org_status ON public.listings(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_urgency_created ON public.listings(urgency, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_location_status ON public.listings(location, status);

-- Application performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status_created ON public.applications(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_coach_status ON public.applications(coach_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_listing_status ON public.applications(listing_id, status);

-- Booking performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_start_at ON public.bookings(status, start_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_org_status ON public.bookings(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_coach_status ON public.bookings(coach_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_range ON public.bookings(start_at, end_at);

-- Message threading and temporal indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread_created ON public.messages(thread_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);

-- User lookup optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created ON public.users(role, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));

-- Coach profile search optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_profiles_rating ON public.coach_profiles(rating_avg DESC NULLS LAST);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_profiles_rates ON public.coach_profiles(rate_hourly, rate_flat);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_profiles_specialties ON public.coach_profiles USING GIN(specialties);

-- Full-text search indexes (for future search functionality)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_search ON public.listings USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_profiles_search ON public.coach_profiles USING GIN(to_tsvector('english', COALESCE(bio, '')));

-- =====================================================
-- 2. Query Optimization Views
-- =====================================================

-- View for active listings with org details (commonly queried together)
CREATE OR REPLACE VIEW public.active_listings_with_org AS
SELECT 
  l.*,
  u.name as org_name,
  op.org_type,
  op.suburbs as org_suburbs
FROM public.listings l
JOIN public.users u ON l.org_id = u.id
JOIN public.org_profiles op ON u.id = op.user_id
WHERE l.status = 'active'
AND l.created_at > NOW() - INTERVAL '30 days'; -- Only recent listings

-- View for coach profiles with ratings and application counts
CREATE OR REPLACE VIEW public.coach_profiles_enhanced AS
SELECT 
  cp.*,
  u.name,
  u.email,
  u.created_at as user_created_at,
  COALESCE(app_stats.total_applications, 0) as total_applications,
  COALESCE(app_stats.accepted_applications, 0) as accepted_applications,
  COALESCE(booking_stats.completed_bookings, 0) as completed_bookings
FROM public.coach_profiles cp
JOIN public.users u ON cp.user_id = u.id
LEFT JOIN (
  SELECT 
    coach_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_applications
  FROM public.applications
  GROUP BY coach_id
) app_stats ON cp.user_id = app_stats.coach_id
LEFT JOIN (
  SELECT 
    coach_id,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
  FROM public.bookings
  GROUP BY coach_id
) booking_stats ON cp.user_id = booking_stats.coach_id;

-- View for application details with listing and coach info
CREATE OR REPLACE VIEW public.applications_detailed AS
SELECT 
  a.*,
  l.title as listing_title,
  l.location as listing_location,
  l.pay_min,
  l.pay_max,
  l.urgency,
  u_coach.name as coach_name,
  cp.rating_avg as coach_rating,
  cp.specialties as coach_specialties,
  u_org.name as org_name
FROM public.applications a
JOIN public.listings l ON a.listing_id = l.id
JOIN public.users u_coach ON a.coach_id = u_coach.id
JOIN public.coach_profiles cp ON u_coach.id = cp.user_id
JOIN public.users u_org ON l.org_id = u_org.id;

-- =====================================================
-- 3. Performance Functions
-- =====================================================

-- Function to efficiently search coaches by location and specialties
CREATE OR REPLACE FUNCTION public.search_coaches(
  search_suburbs text[],
  search_specialties text[] DEFAULT NULL,
  min_rating numeric DEFAULT NULL,
  max_hourly_rate numeric DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS SETOF public.coach_profiles_enhanced
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.coach_profiles_enhanced cpe
  WHERE 
    (search_suburbs IS NULL OR cpe.suburbs && search_suburbs)
    AND (search_specialties IS NULL OR cpe.specialties && search_specialties)
    AND (min_rating IS NULL OR cpe.rating_avg >= min_rating)
    AND (max_hourly_rate IS NULL OR cpe.rate_hourly <= max_hourly_rate)
  ORDER BY cpe.rating_avg DESC NULLS LAST, cpe.total_applications DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get coach availability for a date range
CREATE OR REPLACE FUNCTION public.get_coach_availability(
  coach_user_id uuid,
  start_date date,
  end_date date
)
RETURNS jsonb
AS $$
DECLARE
  coach_availability jsonb;
  booked_times jsonb;
BEGIN
  -- Get coach's general availability
  SELECT availability INTO coach_availability
  FROM public.coach_profiles
  WHERE user_id = coach_user_id;

  -- Get booked times in the date range
  SELECT jsonb_agg(
    jsonb_build_object(
      'start', start_at,
      'end', end_at,
      'status', status
    )
  ) INTO booked_times
  FROM public.bookings
  WHERE coach_id = coach_user_id
    AND start_at::date BETWEEN start_date AND end_date
    AND status IN ('confirmed', 'completed');

  RETURN jsonb_build_object(
    'availability', coach_availability,
    'booked_times', COALESCE(booked_times, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get dashboard stats efficiently
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(user_id uuid)
RETURNS jsonb
AS $$
DECLARE
  user_role_val user_role;
  result jsonb;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM public.users WHERE id = user_id;

  IF user_role_val = 'coach' THEN
    -- Coach dashboard stats
    SELECT jsonb_build_object(
      'total_applications', COUNT(a.*),
      'pending_applications', COUNT(a.*) FILTER (WHERE a.status = 'pending'),
      'accepted_applications', COUNT(a.*) FILTER (WHERE a.status = 'accepted'),
      'total_bookings', COUNT(b.*),
      'upcoming_bookings', COUNT(b.*) FILTER (WHERE b.start_at > NOW() AND b.status = 'confirmed'),
      'completed_bookings', COUNT(b.*) FILTER (WHERE b.status = 'completed')
    ) INTO result
    FROM public.applications a
    FULL OUTER JOIN public.bookings b ON b.coach_id = user_id
    WHERE a.coach_id = user_id OR b.coach_id = user_id;

  ELSIF user_role_val = 'org' THEN
    -- Organization dashboard stats
    SELECT jsonb_build_object(
      'total_listings', COUNT(l.*),
      'active_listings', COUNT(l.*) FILTER (WHERE l.status = 'active'),
      'total_applications', COUNT(a.*),
      'pending_applications', COUNT(a.*) FILTER (WHERE a.status = 'pending'),
      'total_bookings', COUNT(b.*),
      'upcoming_bookings', COUNT(b.*) FILTER (WHERE b.start_at > NOW() AND b.status = 'confirmed')
    ) INTO result
    FROM public.listings l
    LEFT JOIN public.applications a ON l.id = a.listing_id
    LEFT JOIN public.bookings b ON l.id = b.listing_id
    WHERE l.org_id = user_id;

  ELSE
    result := '{}'::jsonb;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 4. Automated Statistics Updates
-- =====================================================

-- Function to update coach ratings (called via trigger or cron)
CREATE OR REPLACE FUNCTION public.update_coach_rating(coach_user_id uuid)
RETURNS void
AS $$
BEGIN
  UPDATE public.coach_profiles
  SET 
    rating_avg = (
      SELECT ROUND(AVG(rating), 2)
      FROM public.bookings
      WHERE coach_id = coach_user_id 
        AND status = 'rated'
        AND rating IS NOT NULL
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.bookings
      WHERE coach_id = coach_user_id 
        AND status = 'rated'
        AND rating IS NOT NULL
    )
  WHERE user_id = coach_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Database Maintenance and Monitoring
-- =====================================================

-- View for monitoring table sizes and performance
CREATE OR REPLACE VIEW public.table_performance_stats AS
SELECT
  schemaname,
  tablename,
  attname as column_name,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- View for monitoring slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW public.slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- =====================================================
-- 6. Cleanup and Archival Functions
-- =====================================================

-- Function to archive old completed bookings
CREATE OR REPLACE FUNCTION public.archive_old_bookings(cutoff_date date DEFAULT CURRENT_DATE - INTERVAL '1 year')
RETURNS integer
AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Create archive table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.bookings_archive (LIKE public.bookings INCLUDING ALL);

  -- Move old completed bookings to archive
  WITH moved_bookings AS (
    DELETE FROM public.bookings
    WHERE status IN ('completed', 'cancelled')
      AND end_at::date < cutoff_date
    RETURNING *
  )
  INSERT INTO public.bookings_archive
  SELECT * FROM moved_bookings;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old message threads
CREATE OR REPLACE FUNCTION public.cleanup_old_messages(cutoff_date date DEFAULT CURRENT_DATE - INTERVAL '2 years')
RETURNS integer
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.messages
  WHERE created_at::date < cutoff_date
    AND thread_id NOT IN (
      SELECT id FROM public.bookings WHERE status IN ('confirmed', 'completed')
      UNION
      SELECT id FROM public.listings WHERE status = 'active'
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Performance Monitoring Triggers
-- =====================================================

-- Function to log slow queries
CREATE OR REPLACE FUNCTION public.log_performance_issue()
RETURNS trigger
AS $$
BEGIN
  -- Log performance issues (this would integrate with your monitoring system)
  RAISE LOG 'Performance issue detected in table %: %', TG_TABLE_NAME, TG_OP;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.active_listings_with_org TO anon, authenticated;
GRANT SELECT ON public.coach_profiles_enhanced TO anon, authenticated;
GRANT SELECT ON public.applications_detailed TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_coaches TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coach_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats TO authenticated;

-- Comments for documentation
COMMENT ON VIEW public.active_listings_with_org IS 'Optimized view for displaying active listings with organization details';
COMMENT ON VIEW public.coach_profiles_enhanced IS 'Enhanced coach profiles with computed stats for efficient dashboard queries';
COMMENT ON FUNCTION public.search_coaches IS 'Optimized function for searching coaches with multiple filters';
COMMENT ON FUNCTION public.get_user_dashboard_stats IS 'Efficient dashboard statistics calculation for both coaches and organizations';