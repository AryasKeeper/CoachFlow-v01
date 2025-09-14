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
  Shield,
  Eye,
  EyeOff,
  Users,
  Globe,
  Lock,
  Search,
  UserCheck,
  Check,
  Loader2
} from "lucide-react"

interface PrivacySettingsProps {
  user: any
  profile: any
  onChanges: (hasChanges: boolean) => void
}

export function PrivacySettings({ user, profile, onChanges }: PrivacySettingsProps) {
  const [loading, setLoading] = useState(false)

  // Initialize from profile privacy_settings or defaults
  const defaultPrivacy = {
    profileVisibility: 'public', // public, organizations, private
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showAvailability: true,
    showRating: true,
    allowMessages: true,
    searchable: true,
    showInDirectory: true
  }

  const [privacy, setPrivacy] = useState(
    profile?.privacy_settings || defaultPrivacy
  )

  const handleChange = (key: string, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }))
    onChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Save privacy settings to coach_profiles
      const { error } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          privacy_settings: privacy
        })

      if (error) throw error

      toast.success('Privacy settings updated')
      onChanges(false)
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Privacy Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Control who can see your information and contact you
        </p>
      </div>

      <Separator />

      {/* Profile Visibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Label>Profile Visibility</Label>
        <RadioGroup
          value={privacy.profileVisibility}
          onValueChange={(value) => handleChange('profileVisibility', value)}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value="public" id="public" />
            <div className="space-y-1">
              <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4" />
                Public
              </Label>
              <p className="text-xs text-muted-foreground">
                Anyone can view your profile and contact you through the platform
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value="organizations" id="organizations" />
            <div className="space-y-1">
              <Label htmlFor="organizations" className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4" />
                Organizations Only
              </Label>
              <p className="text-xs text-muted-foreground">
                Only verified organizations can view your full profile
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value="private" id="private" />
            <div className="space-y-1">
              <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                <Lock className="w-4 h-4" />
                Private
              </Label>
              <p className="text-xs text-muted-foreground">
                Your profile is hidden from search and can only be accessed via direct link
              </p>
            </div>
          </motion.div>
        </RadioGroup>
      </motion.div>

      <Separator />

      {/* Information Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label>Information Display</Label>
        <p className="text-sm text-muted-foreground -mt-2">
          Choose what information is visible on your public profile
        </p>

        <div className="space-y-3">
          {[
            {
              key: 'showEmail',
              label: 'Email Address',
              description: 'Display your email on your profile',
              icon: privacy.showEmail ? Eye : EyeOff
            },
            {
              key: 'showPhone',
              label: 'Phone Number',
              description: 'Display your phone number',
              icon: privacy.showPhone ? Eye : EyeOff
            },
            {
              key: 'showLocation',
              label: 'Location',
              description: 'Show your city and state',
              icon: privacy.showLocation ? Eye : EyeOff
            },
            {
              key: 'showAvailability',
              label: 'Availability Status',
              description: 'Show when you\'re available for coaching',
              icon: privacy.showAvailability ? Eye : EyeOff
            },
            {
              key: 'showRating',
              label: 'Ratings & Reviews',
              description: 'Display your ratings and reviews',
              icon: privacy.showRating ? Eye : EyeOff
            }
          ].map((setting, index) => {
            const Icon = setting.icon
            const isEnabled = privacy[setting.key as keyof typeof privacy]

            return (
              <motion.div
                key={setting.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
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
                  checked={isEnabled as boolean}
                  onCheckedChange={(value) => handleChange(setting.key, value)}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <Separator />

      {/* Communication Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Label>Communication & Discovery</Label>

        <div className="space-y-3">
          {[
            {
              key: 'allowMessages',
              label: 'Allow Direct Messages',
              description: 'Organizations can send you messages',
              icon: UserCheck
            },
            {
              key: 'searchable',
              label: 'Searchable Profile',
              description: 'Appear in search results',
              icon: Search
            },
            {
              key: 'showInDirectory',
              label: 'Coach Directory',
              description: 'Be listed in the coach directory',
              icon: Users
            }
          ].map((setting, index) => {
            const Icon = setting.icon
            const isEnabled = privacy[setting.key as keyof typeof privacy]

            return (
              <motion.div
                key={setting.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
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
              Save Privacy Settings
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}