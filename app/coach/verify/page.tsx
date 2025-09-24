"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { 
  Shield,
  FileCheck,
  Heart,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar
} from "lucide-react"

interface VerificationForm {
  wwcc_number: string
  wwcc_expiry: string
  insurance_url: string
  first_aid_url: string
}

export default function CoachVerifyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState({
    wwcc: false,
    insurance: false,
    firstAid: false
  })
  
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<VerificationForm>()
  
  useEffect(() => {
    loadVerificationData()
  }, [])
  
  async function loadVerificationData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('coach_profiles')
      .select('wwcc_number, wwcc_expiry, insurance_url, first_aid_url')
      .eq('user_id', user.id)
      .single()
      
    if (profile) {
      setValue('wwcc_number', profile.wwcc_number || '')
      setValue('wwcc_expiry', profile.wwcc_expiry || '')
      setValue('insurance_url', profile.insurance_url || '')
      setValue('first_aid_url', profile.first_aid_url || '')
      
      setVerificationStatus({
        wwcc: !!profile.wwcc_number,
        insurance: !!profile.insurance_url,
        firstAid: !!profile.first_aid_url
      })
    }
  }
  
  const onSubmit = async (data: VerificationForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in")
        return
      }
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('coach_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      const profileData = {
        wwcc_number: data.wwcc_number || null,
        wwcc_expiry: data.wwcc_expiry || null,
        insurance_url: data.insurance_url || null,
        first_aid_url: data.first_aid_url || null,
      }
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('coach_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          
        if (updateError) {
          setError(updateError.message)
          return
        }
      } else {
        // Create new profile with verification data
        const { error: insertError } = await supabase
          .from('coach_profiles')
          .insert({
            user_id: user.id,
            ...profileData
          })
          
        if (insertError) {
          setError(insertError.message)
          return
        }
      }
      
      setSuccess(true)
      setVerificationStatus({
        wwcc: !!data.wwcc_number,
        insurance: !!data.insurance_url,
        firstAid: !!data.first_aid_url
      })
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Only WWCC is required for verified status
  const isVerified = verificationStatus.wwcc
  const hasOptionalDocs = verificationStatus.insurance || verificationStatus.firstAid
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Verification Documents</h1>
      
      <div className="mb-8">
        {isVerified ? (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-200 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Verified Coach</p>
              <p className="text-sm text-green-700">
                You can now apply for coaching opportunities
                {!hasOptionalDocs && " • Consider adding First Aid and Insurance to stand out"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Verification Required</p>
              <p className="text-sm text-orange-700">Upload your Working with Children Check to start applying for jobs</p>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="p-4 rounded-lg bg-green-500/10 text-green-700 border border-green-200">
            Verification documents updated successfully!
          </div>
        )}
        
        {/* WWCC Section */}
        <GlassCard>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verificationStatus.wwcc ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                <Shield className={`w-5 h-5 ${
                  verificationStatus.wwcc ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Working with Children Check</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="text-red-500">*</span> Required for verification
                </p>
              </div>
            </div>
            {verificationStatus.wwcc && (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wwcc_number">WWCC Number</Label>
              <Input
                id="wwcc_number"
                type="text"
                placeholder="WWC0123456"
                {...register("wwcc_number", {
                  required: "WWCC number is required",
                  pattern: {
                    value: /^[A-Z0-9]+$/,
                    message: "Invalid WWCC number format"
                  }
                })}
              />
              {errors.wwcc_number && (
                <p className="text-sm text-destructive">{errors.wwcc_number.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wwcc_expiry">Expiry Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="wwcc_expiry"
                  type="date"
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  {...register("wwcc_expiry", {
                    required: "Expiry date is required"
                  })}
                />
              </div>
              {errors.wwcc_expiry && (
                <p className="text-sm text-destructive">{errors.wwcc_expiry.message}</p>
              )}
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a 
                  href="https://wwccheck.service.nsw.gov.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Apply for WWCC online
                </a>
              </p>
            </div>
          </div>
        </GlassCard>
        
        {/* Insurance Section */}
        <GlassCard>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verificationStatus.insurance ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                <FileCheck className={`w-5 h-5 ${
                  verificationStatus.insurance ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Professional Insurance</h2>
                <p className="text-sm text-muted-foreground">
                  Optional • Enhances your profile credibility
                </p>
              </div>
            </div>
            {verificationStatus.insurance && (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="insurance_url">Document URL</Label>
            <div className="relative">
              <Upload className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="insurance_url"
                type="url"
                className="pl-10"
                placeholder="https://drive.google.com/file/..."
                {...register("insurance_url", {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "Please enter a valid URL"
                  }
                })}
              />
            </div>
            {errors.insurance_url && (
              <p className="text-sm text-destructive">{errors.insurance_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload to Google Drive, Dropbox, or similar and paste the sharing link
            </p>
          </div>
        </GlassCard>
        
        {/* First Aid Section */}
        <GlassCard>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verificationStatus.firstAid ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                <Heart className={`w-5 h-5 ${
                  verificationStatus.firstAid ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">First Aid & CPR</h2>
                <p className="text-sm text-muted-foreground">
                  Optional • Shows you're prepared for emergencies
                </p>
              </div>
            </div>
            {verificationStatus.firstAid && (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="first_aid_url">Document URL</Label>
            <div className="relative">
              <Upload className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="first_aid_url"
                type="url"
                className="pl-10"
                placeholder="https://drive.google.com/file/..."
                {...register("first_aid_url", {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "Please enter a valid URL"
                  }
                })}
              />
            </div>
            {errors.first_aid_url && (
              <p className="text-sm text-destructive">{errors.first_aid_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload to Google Drive, Dropbox, or similar and paste the sharing link
            </p>
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
            {isLoading ? "Saving..." : "Save Documents"}
          </Button>
        </div>
      </form>
      
      {/* Info Section */}
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">Verification Requirements</h3>
          <div className="text-sm text-blue-800">
            <p className="mb-2"><span className="font-medium">Required:</span> Working with Children Check (WWCC) - legally required to work with minors in Australia</p>
            <p><span className="font-medium">Optional Enhancements:</span> First Aid & CPR, Professional Insurance - boost your profile's trust and credibility</p>
          </div>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Benefits of verification</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Organizations trust verified coaches more</li>
            <li>• You'll appear higher in search results</li>
            <li>• Access to more coaching opportunities</li>
            <li>• Build credibility with parents and schools</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
