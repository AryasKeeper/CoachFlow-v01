"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Check,
  Loader2
} from "lucide-react"

interface NotificationSettingsProps {
  user: any
  profile: any
  onChanges: (hasChanges: boolean) => void
}

export function NotificationSettings({ user, profile, onChanges }: NotificationSettingsProps) {
  const [loading, setLoading] = useState(false)

  // Initialize from profile notification_preferences or defaults
  const defaultPreferences = {
    // Email Notifications
    emailNewBookings: true,
    emailApplicationStatus: true,
    emailMessages: true,
    emailReminders: true,
    emailMarketing: false,

    // Push Notifications
    pushNewBookings: true,
    pushApplicationStatus: true,
    pushMessages: true,
    pushReminders: false,

    // In-App Notifications
    inAppAll: true,
    inAppBookings: true,
    inAppMessages: true,
    inAppUpdates: true
  }

  const [notifications, setNotifications] = useState(
    profile?.notification_preferences || defaultPreferences
  )

  const handleToggle = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    onChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Save notification preferences to coach_profiles
      const { error } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          notification_preferences: notifications
        })

      if (error) throw error

      toast.success('Notification preferences updated')
      onChanges(false)
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('Failed to update notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const notificationGroups = [
    {
      title: "Email Notifications",
      icon: Mail,
      description: "Choose what emails you want to receive",
      settings: [
        {
          key: 'emailNewBookings',
          label: 'New Bookings',
          description: 'Get notified when you receive new booking requests',
          icon: Calendar
        },
        {
          key: 'emailApplicationStatus',
          label: 'Application Updates',
          description: 'Updates on your job applications',
          icon: TrendingUp
        },
        {
          key: 'emailMessages',
          label: 'Messages',
          description: 'New messages from organizations',
          icon: MessageSquare
        },
        {
          key: 'emailReminders',
          label: 'Reminders',
          description: 'Upcoming sessions and important dates',
          icon: Bell
        },
        {
          key: 'emailMarketing',
          label: 'Marketing & Updates',
          description: 'Product updates and coaching tips',
          icon: Star
        }
      ]
    },
    {
      title: "Push Notifications",
      icon: Smartphone,
      description: "Mobile and browser notifications",
      settings: [
        {
          key: 'pushNewBookings',
          label: 'New Bookings',
          description: 'Instant alerts for new bookings',
          icon: Calendar
        },
        {
          key: 'pushApplicationStatus',
          label: 'Application Status',
          description: 'Real-time application updates',
          icon: TrendingUp
        },
        {
          key: 'pushMessages',
          label: 'Direct Messages',
          description: 'Instant message notifications',
          icon: MessageSquare
        },
        {
          key: 'pushReminders',
          label: 'Session Reminders',
          description: '15 minutes before sessions',
          icon: Bell
        }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Notification Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Control how and when you receive notifications
        </p>
      </div>

      <Separator />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allOn = Object.fromEntries(
              Object.keys(notifications).map(key => [key, true])
            )
            setNotifications(allOn as any)
            onChanges(true)
          }}
        >
          Enable All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allOff = Object.fromEntries(
              Object.keys(notifications).map(key => [key, false])
            )
            setNotifications(allOff as any)
            onChanges(true)
          }}
        >
          Disable All
        </Button>
      </motion.div>

      {/* Notification Groups */}
      {notificationGroups.map((group, groupIndex) => {
        const GroupIcon = group.icon

        return (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <GroupIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{group.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              {group.description}
            </p>

            <div className="space-y-3">
              {group.settings.map((setting, index) => {
                const SettingIcon = setting.icon
                const isEnabled = notifications[setting.key as keyof typeof notifications]

                return (
                  <motion.div
                    key={setting.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <SettingIcon className={`w-4 h-4 mt-0.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="space-y-1">
                        <Label htmlFor={setting.key} className="text-sm font-medium cursor-pointer">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(setting.key)}
                    />
                  </motion.div>
                )
              })}
            </div>

            {groupIndex < notificationGroups.length - 1 && <Separator className="mt-6" />}
          </motion.div>
        )
      })}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end pt-4"
      >
        <Button
          onClick={handleSave}
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}