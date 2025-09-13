"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuburbSelector } from "@/components/ui/suburb-selector"
import { Settings, Building2, Mail, Phone, MapPin, Save, AlertCircle, CheckCircle } from "lucide-react"

interface OrgProfile {
  org_name: string
  org_type: string
  description: string
  phone: string
  suburbs: string[]
}

interface SettingsFormProps {
  userEmail: string
  userId: string
  existingProfile?: any
}

export function SettingsForm({ userEmail, userId, existingProfile }: SettingsFormProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [suburbs, setSuburbs] = useState<string[]>(existingProfile?.suburbs || [])
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<OrgProfile>({
    defaultValues: {
      org_name: existingProfile?.org_name || "",
      org_type: existingProfile?.org_type || "",
      description: existingProfile?.description || "",
      phone: existingProfile?.phone || "",
    }
  })
  
  const orgTypes = [
    "School",
    "Basketball Club",
    "Sports Academy",
    "Community Center",
    "Recreation Center",
    "Private Organization",
    "Other"
  ]
  
  const onSubmit = async (data: OrgProfile) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const profileData = {
        user_id: userId,
        org_name: data.org_name,
        org_type: data.org_type,
        description: data.description,
        phone: data.phone,
        suburbs: suburbs
      }
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('org_profiles')
          .update(profileData)
          .eq('user_id', userId)
          
        if (updateError) {
          setError(updateError.message)
          return
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('org_profiles')
          .insert(profileData)
          
        if (insertError) {
          setError(insertError.message)
          return
        }
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Your profile has been updated successfully!</span>
        </div>
      )}
      
      {/* Basic Information */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Basic Information</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization Name *</Label>
            <Input 
              id="org_name" 
              placeholder="Enter organization name"
              {...register("org_name", {
                required: "Organization name is required"
              })}
            />
            {errors.org_name && (
              <p className="text-sm text-destructive">{errors.org_name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="org_type">Organization Type *</Label>
            <Select 
              defaultValue={existingProfile?.org_type}
              onValueChange={(value) => setValue("org_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {orgTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Tell coaches about your organization..."
              rows={3}
              {...register("description")}
            />
          </div>
        </div>
      </GlassCard>

      {/* Contact Information */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Contact Information</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={userEmail} disabled />
            <p className="text-sm text-muted-foreground">
              This is your login email and cannot be changed here
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="phone" 
                className="pl-10" 
                placeholder="+61 400 000 000"
                {...register("phone", {
                  pattern: {
                    value: /^(\+61|0)[2-9]\d{8}$/,
                    message: "Please enter a valid Australian phone number"
                  }
                })}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Location */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Location & Coverage</h2>
        </div>
        
        <div className="space-y-4">
          <SuburbSelector
            value={suburbs}
            onChange={setSuburbs}
            label="Service Areas (Suburbs)"
            placeholder="Type suburb names..."
            maxSuburbs={5}
            description="Select up to 5 suburbs where you operate"
          />
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}