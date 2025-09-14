export type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_viewed'
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_expiring'
  | 'profile_verified'
  | 'profile_incomplete'
  | 'review_received'
  | 'achievement_unlocked'
  | 'system_update'
  | 'maintenance'
  | 'feature_announcement'

export type NotificationCategory =
  | 'application'
  | 'booking'
  | 'listing'
  | 'profile'
  | 'system'

export type NotificationPriority = 'high' | 'medium' | 'low'

export interface ContactDetails {
  email?: string
  phone?: string
}

export interface NotificationMetadata {
  entity_type: 'application' | 'booking' | 'listing' | 'profile'
  entity_id: string
  listing_id?: string
  coach_id?: string
  coach_name?: string
  org_name?: string
  status?: string
  date?: string
  time?: string
  location?: string
  action_url?: string
  contact_details?: ContactDetails
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  body: string
  metadata: NotificationMetadata
  priority: NotificationPriority
  read_at?: string | null
  archived_at?: string | null
  created_at: string
  expires_at?: string | null
}

export interface NotificationChannels {
  in_app: boolean
  email: boolean
  email_digest: 'immediate' | 'daily' | 'weekly'
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
}

export interface NotificationPreferences {
  applications?: {
    new_application?: boolean
    application_viewed?: boolean
    application_status?: boolean
    application_withdrawn?: boolean
  }
  bookings?: {
    booking_request?: boolean
    booking_confirmed?: boolean
    booking_reminder?: boolean
    booking_cancelled?: boolean
  }
  listings?: {
    listing_status?: boolean
    listing_expiring?: boolean
    high_interest?: boolean
    listing_applications?: boolean
  }
  profile?: {
    verification?: boolean
    reviews?: boolean
    achievements?: boolean
  }
  system?: {
    updates?: boolean
    maintenance?: boolean
    features?: boolean
  }
}

// Notification icons and colors for UI
export const notificationConfig: Record<NotificationCategory, {
  icon: string
  color: string
  bgColor: string
}> = {
  application: {
    icon: '📋',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  booking: {
    icon: '📅',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  listing: {
    icon: '📝',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  profile: {
    icon: '👤',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  system: {
    icon: '🔧',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
}

// Priority indicators
export const priorityConfig: Record<NotificationPriority, {
  badge: string
  color: string
}> = {
  high: {
    badge: '🔴',
    color: 'text-red-600'
  },
  medium: {
    badge: '🟡',
    color: 'text-yellow-600'
  },
  low: {
    badge: '⚪',
    color: 'text-gray-400'
  }
}