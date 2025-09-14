import { createClient } from "@/lib/supabase/client"
import type { Notification, NotificationType, NotificationCategory } from "@/lib/types/notifications"

/**
 * Creates a test notification for development and testing purposes
 * @param userId - The user ID to send the notification to
 * @param type - The type of notification to create
 * @returns Promise with the created notification
 */
export async function createTestNotification(
  userId: string,
  type: NotificationType = "new_application"
): Promise<Notification | null> {
  const supabase = createClient()

  const testNotifications: Record<NotificationType, {
    category: NotificationCategory
    title: string
    body: string
    metadata: any
    priority: "high" | "medium" | "low"
  }> = {
    new_application: {
      category: "application",
      title: "New Application Received",
      body: "John Smith has applied to your listing: Senior Basketball Coach - Sydney FC Academy",
      metadata: {
        entity_type: "application",
        entity_id: "test-application-1",
        listing_id: "test-listing-1",
        coach_id: "test-coach-1",
        coach_name: "John Smith",
        action_url: "/org/applications/test-application-1"
      },
      priority: "high"
    },
    application_accepted: {
      category: "application",
      title: "Congratulations! Your application has been accepted",
      body: "Your application for \"Senior Basketball Coach\" at Sydney FC has been accepted! Contact details have been shared with you.",
      metadata: {
        entity_type: "application",
        entity_id: "test-application-2",
        listing_id: "test-listing-2",
        status: "accepted",
        action_url: "/coach/applications/test-application-2",
        contact_details: {
          email: "coaching@sydneyfc.com",
          phone: "+61 2 9999 0000"
        }
      },
      priority: "high"
    },
    application_rejected: {
      category: "application",
      title: "Application Status Updated",
      body: "Your application for \"Basketball Coach\" has been updated.",
      metadata: {
        entity_type: "application",
        entity_id: "test-application-3",
        listing_id: "test-listing-3",
        status: "rejected",
        action_url: "/coach/applications/test-application-3"
      },
      priority: "medium"
    },
    application_viewed: {
      category: "application",
      title: "Your application was viewed",
      body: "Sydney Basketball Academy has viewed your application",
      metadata: {
        entity_type: "application",
        entity_id: "test-application-4",
        action_url: "/coach/applications/test-application-4"
      },
      priority: "low"
    },
    booking_request: {
      category: "booking",
      title: "New Booking Request",
      body: "Western Sydney Sports Club has requested a booking for Monday, 15 January 2025",
      metadata: {
        entity_type: "booking",
        entity_id: "test-booking-1",
        org_name: "Western Sydney Sports Club",
        date: "2025-01-15",
        time: "3:00 PM - 5:00 PM",
        location: "Sydney Olympic Park",
        action_url: "/coach/bookings/test-booking-1"
      },
      priority: "high"
    },
    booking_confirmed: {
      category: "booking",
      title: "Booking Confirmed",
      body: "Your booking for Tuesday, 16 January 2025 has been confirmed",
      metadata: {
        entity_type: "booking",
        entity_id: "test-booking-2",
        date: "2025-01-16",
        time: "4:00 PM - 6:00 PM",
        action_url: "/coach/bookings/test-booking-2"
      },
      priority: "medium"
    },
    booking_declined: {
      category: "booking",
      title: "Booking Declined",
      body: "Your booking request for Wednesday, 17 January 2025 was declined",
      metadata: {
        entity_type: "booking",
        entity_id: "test-booking-3",
        action_url: "/coach/bookings/test-booking-3"
      },
      priority: "medium"
    },
    booking_reminder: {
      category: "booking",
      title: "Upcoming Session Reminder",
      body: "You have a coaching session in 2 hours at Sydney Olympic Park",
      metadata: {
        entity_type: "booking",
        entity_id: "test-booking-4",
        time: "2:00 PM",
        location: "Sydney Olympic Park",
        action_url: "/coach/bookings/test-booking-4"
      },
      priority: "high"
    },
    booking_cancelled: {
      category: "booking",
      title: "Booking Cancelled",
      body: "Your booking for Thursday, 18 January 2025 has been cancelled",
      metadata: {
        entity_type: "booking",
        entity_id: "test-booking-5",
        action_url: "/coach/bookings/test-booking-5"
      },
      priority: "medium"
    },
    listing_approved: {
      category: "listing",
      title: "Listing Approved",
      body: "Your listing \"Senior Basketball Coach\" has been approved and is now live",
      metadata: {
        entity_type: "listing",
        entity_id: "test-listing-1",
        action_url: "/org/listings/test-listing-1"
      },
      priority: "medium"
    },
    listing_rejected: {
      category: "listing",
      title: "Listing Requires Changes",
      body: "Your listing needs some updates before it can go live",
      metadata: {
        entity_type: "listing",
        entity_id: "test-listing-2",
        action_url: "/org/listings/test-listing-2/edit"
      },
      priority: "medium"
    },
    listing_expiring: {
      category: "listing",
      title: "Listing Expiring Soon",
      body: "Your listing \"Basketball Coach\" will expire in 3 days",
      metadata: {
        entity_type: "listing",
        entity_id: "test-listing-3",
        action_url: "/org/listings/test-listing-3"
      },
      priority: "low"
    },
    profile_verified: {
      category: "profile",
      title: "Profile Verified! ✅",
      body: "Your coaching profile has been verified. You can now apply to premium listings.",
      metadata: {
        entity_type: "profile",
        entity_id: "test-profile-1",
        action_url: "/coach/profile"
      },
      priority: "high"
    },
    profile_incomplete: {
      category: "profile",
      title: "Complete Your Profile",
      body: "Your profile is 75% complete. Add your certifications to unlock more opportunities.",
      metadata: {
        entity_type: "profile",
        entity_id: "test-profile-2",
        action_url: "/coach/profile/edit"
      },
      priority: "low"
    },
    review_received: {
      category: "profile",
      title: "New Review Received",
      body: "Sydney FC Academy left you a 5-star review!",
      metadata: {
        entity_type: "profile",
        entity_id: "test-profile-3",
        action_url: "/coach/profile#reviews"
      },
      priority: "medium"
    },
    achievement_unlocked: {
      category: "profile",
      title: "Achievement Unlocked! 🏆",
      body: "You've completed 10 coaching sessions. Keep up the great work!",
      metadata: {
        entity_type: "profile",
        entity_id: "test-profile-4",
        action_url: "/coach/profile#achievements"
      },
      priority: "low"
    },
    system_update: {
      category: "system",
      title: "Platform Update",
      body: "We've added new features to help you connect with more organizations",
      metadata: {
        entity_type: "profile",
        entity_id: "system-1"
      },
      priority: "low"
    },
    maintenance: {
      category: "system",
      title: "Scheduled Maintenance",
      body: "CoachFlow will be undergoing maintenance on Sunday, 21 January from 2 AM to 4 AM AEDT",
      metadata: {
        entity_type: "profile",
        entity_id: "system-2"
      },
      priority: "medium"
    },
    feature_announcement: {
      category: "system",
      title: "New Feature: Video Introductions",
      body: "You can now add video introductions to your profile to stand out",
      metadata: {
        entity_type: "profile",
        entity_id: "system-3",
        action_url: "/coach/profile/edit"
      },
      priority: "low"
    }
  }

  const notificationData = testNotifications[type]

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      ...notificationData
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating test notification:", error)
    return null
  }

  return data
}

/**
 * Creates multiple test notifications of different types
 * @param userId - The user ID to send notifications to
 * @param count - Number of random notifications to create
 */
export async function createMultipleTestNotifications(
  userId: string,
  count: number = 5
): Promise<void> {
  const types: NotificationType[] = [
    "new_application",
    "application_accepted",
    "booking_request",
    "listing_approved",
    "profile_verified",
    "review_received"
  ]

  for (let i = 0; i < count; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)]
    await createTestNotification(userId, randomType)
    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).createTestNotification = createTestNotification
  (window as any).createMultipleTestNotifications = createMultipleTestNotifications
}