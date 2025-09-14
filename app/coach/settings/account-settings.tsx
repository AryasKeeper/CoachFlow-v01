"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Loader2,
  Check,
  X,
  Upload
} from "lucide-react"

interface AccountSettingsProps {
  user: any
  userData: any
  profile: any
  onChanges: (hasChanges: boolean) => void
}

export function AccountSettings({ user, userData, profile, onChanges }: AccountSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: user.email || '',
    firstName: userData?.first_name || '',
    lastName: userData?.last_name || '',
    phone: profile?.phone_number || '', // Using phone_number from coach_profiles
    location: profile?.suburbs?.[0] || '', // Using first suburb as location
    website: profile?.linkedin_url || '' // Using linkedin_url as website for now
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    onChanges(true)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl
        })

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Avatar updated successfully')
      onChanges(false)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Update coach_profiles table with correct field names
      const { error: profileError } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          phone_number: formData.phone, // Changed from 'phone' to 'phone_number'
          suburbs: formData.location ? [formData.location] : [], // Convert to array for suburbs field
          linkedin_url: formData.website // Using linkedin_url field
        })

      if (profileError) throw profileError

      toast.success('Account settings updated successfully')
      onChanges(false)
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error('Failed to update account settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Account Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Update your account information and profile details
        </p>
      </div>

      <Separator />

      {/* Profile Picture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <Avatar className="w-24 h-24">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${formData.firstName} ${formData.lastName}`} />
            ) : null}
            <AvatarFallback>
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {formData.firstName && formData.lastName ? (
                  <span className="text-2xl font-semibold text-primary">
                    {formData.firstName[0]}{formData.lastName[0]}
                  </span>
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label>Personal Information</Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm">
              First Name
            </Label>
            <div className="relative">
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="John"
                className="pl-10"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm">
              Last Name
            </Label>
            <div className="relative">
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
                className="pl-10"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            Email Address
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="pl-10 bg-muted"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed for security reasons
          </p>
        </div>
      </motion.div>

      <Separator />

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Label>Contact Information</Label>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">
              Phone Number
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+61 400 000 000"
                className="pl-10"
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm">
              Location
            </Label>
            <div className="relative">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Sydney, NSW"
                className="pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm">
              Website
            </Label>
            <div className="relative">
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
                className="pl-10"
              />
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
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
              Save Changes
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}