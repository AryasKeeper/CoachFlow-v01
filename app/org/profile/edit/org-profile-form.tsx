"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Upload,
  Save,
  AlertCircle,
  Users,
  Trophy,
  Target,
  Image,
  Plus,
  X,
  Camera
} from "lucide-react"

interface OrgProfileFormProps {
  userId: string
  userEmail: string
  initialData: any
}

export function OrgProfileForm({ userId, userEmail, initialData }: OrgProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url || null)

  // Form state
  const [formData, setFormData] = useState({
    org_name: initialData?.org_name || '',
    contact_person_name: initialData?.contact_person_name || '',
    contact_person_title: initialData?.contact_person_title || '',
    contact_phone: initialData?.contact_phone || '',
    contact_email: initialData?.contact_email || userEmail,
    about_organization: initialData?.about_organization || '',
    team_culture: initialData?.team_culture || '',
    coaching_staff_size: initialData?.coaching_staff_size || 0,
    program_details: initialData?.program_details || '',
    website_url: initialData?.website_url || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || 'NSW',
    zip_code: initialData?.zip_code || '',
    facility_features: initialData?.facility_features || [],
    logo_url: initialData?.logo_url || ''
  })

  const [facilityFeatures, setFacilityFeatures] = useState<string[]>(
    Array.isArray(initialData?.facility_features) ? initialData.facility_features : []
  )

  const FACILITY_OPTIONS = [
    "Indoor Courts",
    "Outdoor Courts",
    "Weight Room",
    "Locker Rooms",
    "Video Analysis Room",
    "Meeting Rooms",
    "Parking Available",
    "Public Transport Access",
    "Cafeteria",
    "Medical Facilities",
    "Equipment Provided",
    "Air Conditioning"
  ]

  const toggleFeature = (feature: string) => {
    if (facilityFeatures.includes(feature)) {
      setFacilityFeatures(facilityFeatures.filter(f => f !== feature))
    } else {
      setFacilityFeatures([...facilityFeatures, feature])
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `org-logos/${fileName}`

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setLogoUrl(publicUrl)
      setFormData(prev => ({ ...prev, logo_url: publicUrl }))
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('Starting profile save...', { userId, formData, facilityFeatures })

      const profileData = {
        ...formData,
        user_id: userId,
        facility_features: facilityFeatures,
        coaching_staff_size: formData.coaching_staff_size || 0
      }

      console.log('Profile data to save:', profileData)

      // Use API route to handle the save
      const response = await fetch('/api/org/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile')
      }

      // Show warning if facility features couldn't be saved
      if (result.warning) {
        console.warn('Warning:', result.warning)
      }

      setSuccess(true)
      // Redirect to profile view after successful save
      setTimeout(() => {
        router.push('/org/profile')
      }, 2000)
    } catch (err: any) {
      console.error('Profile save error:', err)
      // Show more detailed error message
      const errorMessage = err.message || 'An error occurred saving the profile'

      // Check for common database errors
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        setError('Database schema issue: Some fields cannot be saved. Please contact support.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        setError('Permission denied. Please make sure you are logged in.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 text-green-700 border border-green-200 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Profile updated successfully!</p>
            <p className="text-sm">Redirecting to your profile...</p>
          </div>
        </div>
      )}

      {/* Logo Upload */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Image className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Organization Logo</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your organization's logo to build trust and recognition with coaches
        </p>

        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Organization Logo"
                className="w-24 h-24 rounded-lg object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary/50" />
              </div>
            )}

            {/* Upload Button Overlay */}
            <label
              htmlFor="logo-upload"
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Instructions */}
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Logo Requirements</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Recommended size: 200x200 pixels</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Supported formats: JPG, PNG, SVG</li>
            </ul>
            {uploadingLogo && (
              <p className="text-sm text-primary mt-2">Uploading...</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Organization Details */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Organization Details</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization Name *</Label>
            <Input
              id="org_name"
              value={formData.org_name}
              onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
              placeholder="Sydney Basketball Academy"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about_organization">About Your Organization</Label>
            <Textarea
              id="about_organization"
              value={formData.about_organization}
              onChange={(e) => setFormData({ ...formData, about_organization: e.target.value })}
              rows={4}
              placeholder="Tell coaches about your organization's mission, values, and what makes you unique..."
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.about_organization.length}/1000 characters
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website_url"
                  type="url"
                  className="pl-10"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.yourorg.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coaching_staff_size">Current Coaching Staff Size</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="coaching_staff_size"
                  type="number"
                  className="pl-10"
                  value={formData.coaching_staff_size}
                  onChange={(e) => setFormData({ ...formData, coaching_staff_size: parseInt(e.target.value) || 0 })}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Contact Information */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Primary Contact Person</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This person will be the main point of contact for coaches
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_person_name">Contact Name *</Label>
            <Input
              id="contact_person_name"
              value={formData.contact_person_name}
              onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person_title">Title/Position</Label>
            <Input
              id="contact_person_title"
              value={formData.contact_person_title}
              onChange={(e) => setFormData({ ...formData, contact_person_title: e.target.value })}
              placeholder="Sports Director"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="contact_email"
                type="email"
                className="pl-10"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@organization.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="contact_phone"
                type="tel"
                className="pl-10"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="02 9999 9999"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Location */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Location</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City/Suburb *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Sydney"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="NSW"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">Postcode</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="2000"
                maxLength={4}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Culture & Programs */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Culture & Programs</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team_culture">Team Culture & Values</Label>
            <Textarea
              id="team_culture"
              value={formData.team_culture}
              onChange={(e) => setFormData({ ...formData, team_culture: e.target.value })}
              rows={3}
              placeholder="Describe your team culture, coaching philosophy, and organizational values..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.team_culture.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program_details">Program Details</Label>
            <Textarea
              id="program_details"
              value={formData.program_details}
              onChange={(e) => setFormData({ ...formData, program_details: e.target.value })}
              rows={3}
              placeholder="Describe your programs, age groups, competition levels, training schedules..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.program_details.length}/500 characters
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Facility Features */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Facility Features</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select all features available at your facility
        </p>

        <div className="grid md:grid-cols-3 gap-3">
          {FACILITY_OPTIONS.map((feature) => (
            <label
              key={feature}
              className={`
                flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                ${facilityFeatures.includes(feature)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'hover:bg-muted/50'
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={facilityFeatures.includes(feature)}
                onChange={() => toggleFeature(feature)}
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => router.push('/org/dashboard')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}