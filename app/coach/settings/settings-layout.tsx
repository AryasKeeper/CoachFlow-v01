"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Bell,
  Shield,
  Calendar,
  Globe,
  Palette,
  AlertTriangle,
  Settings,
  CheckCircle,
  Mail,
  Smartphone,
  Eye,
  UserX,
  Trash2
} from "lucide-react"
import { AccountSettings } from "./account-settings"
import { NotificationSettings } from "./notification-settings"
import { PrivacySettings } from "./privacy-settings"
import { AvailabilitySettings } from "./availability-settings"
import { PreferencesSettings } from "./preferences-settings"
import { DangerZone } from "./danger-zone"

interface SettingsLayoutProps {
  user: any
  userData: any
  profile: any
}

export function SettingsLayout({ user, userData, profile }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState("account")
  const [hasChanges, setHasChanges] = useState(false)

  const settingsSections = [
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Manage your account details and profile"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Control how you receive updates"
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: Shield,
      description: "Manage your privacy and visibility"
    },
    {
      id: "availability",
      label: "Availability",
      icon: Calendar,
      description: "Set your coaching availability"
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: Palette,
      description: "Customize your app experience"
    },
    {
      id: "danger",
      label: "Danger Zone",
      icon: AlertTriangle,
      description: "Irreversible account actions"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200">
            Free during beta
          </Badge>
        </div>
      </motion.div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlassCard className="sticky top-24">
            <nav className="space-y-1">
              {settingsSections.map((section, index) => {
                const Icon = section.icon
                const isActive = activeTab === section.id
                const isDanger = section.id === "danger"

                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setActiveTab(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 text-left
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : isDanger
                          ? 'hover:bg-red-500/10 text-muted-foreground hover:text-red-600'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isDanger && !isActive ? 'text-red-500' : ''}`} />
                    <div className="flex-1">
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs opacity-70 hidden lg:block">
                        {section.description}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-1 h-8 bg-primary rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>
          </GlassCard>
        </motion.div>

        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <GlassCard className="min-h-[600px]">
            {activeTab === "account" && (
              <AccountSettings
                user={user}
                userData={userData}
                profile={profile}
                onChanges={setHasChanges}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationSettings
                user={user}
                profile={profile}
                onChanges={setHasChanges}
              />
            )}
            {activeTab === "privacy" && (
              <PrivacySettings
                user={user}
                profile={profile}
                onChanges={setHasChanges}
              />
            )}
            {activeTab === "availability" && (
              <AvailabilitySettings
                user={user}
                profile={profile}
                onChanges={setHasChanges}
              />
            )}
            {activeTab === "preferences" && (
              <PreferencesSettings
                user={user}
                profile={profile}
                onChanges={setHasChanges}
              />
            )}
            {activeTab === "danger" && (
              <DangerZone
                user={user}
              />
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Save Changes Bar */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 p-4 glass border-t"
        >
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHasChanges(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  // Save changes logic
                  setHasChanges(false)
                }}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}