"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Palette,
  Globe,
  Monitor,
  Sun,
  Moon,
  Zap,
  MessageSquare,
  Check,
  Loader2
} from "lucide-react"

interface PreferencesSettingsProps {
  user: any
  profile: any
  onChanges: (hasChanges: boolean) => void
}

export function PreferencesSettings({ user, profile, onChanges }: PreferencesSettingsProps) {
  const [loading, setLoading] = useState(false)

  // Initialize from profile app_preferences or defaults
  const defaultPreferences = {
    // Display
    theme: 'system', // light, dark, system
    language: 'en',
    timezone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',

    // Features
    autoAcceptBookings: false,
    showOnlineStatus: true,
    enableSounds: true,
    enableAnimations: true,
    compactView: false,

    // Communication
    messagePreview: true,
    readReceipts: true,
    typingIndicators: true
  }

  const [preferences, setPreferences] = useState(
    profile?.app_preferences || defaultPreferences
  )

  const handleChange = (key: string, value: any) => {
    setPreferences((prev: any) => ({ ...prev, [key]: value }))
    onChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Save app preferences to coach_profiles
      const { error } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          app_preferences: preferences
        })

      if (error) throw error

      toast.success('Preferences updated')
      onChanges(false)
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          App Preferences
        </h2>
        <p className="text-muted-foreground mt-1">
          Customize your CoachFlow experience
        </p>
      </div>

      <Separator />

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Label>Appearance</Label>

        <div className="space-y-3">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Theme Mode</p>
            <RadioGroup
              value={preferences.theme}
              onValueChange={(value) => handleChange('theme', value)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="w-4 h-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="w-4 h-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="w-4 h-4" />
                    System
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <Zap className={`w-4 h-4 mt-0.5 ${preferences.enableAnimations ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="space-y-1">
                <Label htmlFor="animations" className="text-sm font-medium cursor-pointer">
                  Enable Animations
                </Label>
                <p className="text-xs text-muted-foreground">
                  Smooth transitions and micro-interactions
                </p>
              </div>
            </div>
            <Switch
              id="animations"
              checked={preferences.enableAnimations}
              onCheckedChange={(value) => handleChange('enableAnimations', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <Monitor className={`w-4 h-4 mt-0.5 ${preferences.compactView ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="space-y-1">
                <Label htmlFor="compact" className="text-sm font-medium cursor-pointer">
                  Compact View
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing and show more content
                </p>
              </div>
            </div>
            <Switch
              id="compact"
              checked={preferences.compactView}
              onCheckedChange={(value) => handleChange('compactView', value)}
            />
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Regional Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Regional Settings
        </Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Language</p>
              <p className="text-xs text-muted-foreground">Display language</p>
            </div>
            <select
              value={preferences.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="px-3 py-1 rounded-md bg-muted text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Timezone</p>
              <p className="text-xs text-muted-foreground">Your local timezone</p>
            </div>
            <select
              value={preferences.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="px-3 py-1 rounded-md bg-muted text-sm"
            >
              <option value="Australia/Sydney">Sydney (AEDT)</option>
              <option value="Australia/Melbourne">Melbourne (AEDT)</option>
              <option value="Australia/Brisbane">Brisbane (AEST)</option>
              <option value="Australia/Perth">Perth (AWST)</option>
              <option value="Australia/Adelaide">Adelaide (ACDT)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Date Format</p>
              <p className="text-xs text-muted-foreground">How dates are displayed</p>
            </div>
            <select
              value={preferences.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className="px-3 py-1 rounded-md bg-muted text-sm"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Communication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Label className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Communication
        </Label>

        <div className="space-y-3">
          {[
            {
              key: 'messagePreview',
              label: 'Message Previews',
              description: 'Show message content in notifications'
            },
            {
              key: 'readReceipts',
              label: 'Read Receipts',
              description: 'Let others know when you\'ve read their messages'
            },
            {
              key: 'typingIndicators',
              label: 'Typing Indicators',
              description: 'Show when you\'re typing a message'
            },
            {
              key: 'showOnlineStatus',
              label: 'Online Status',
              description: 'Let others see when you\'re online'
            }
          ].map((setting, index) => {
            const isEnabled = preferences[setting.key as keyof typeof preferences]

            return (
              <motion.div
                key={setting.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <Label htmlFor={setting.key} className="text-sm font-medium cursor-pointer">
                    {setting.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.key}
                  checked={isEnabled as boolean}
                  onCheckedChange={(value) => handleChange(setting.key, value)}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>

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