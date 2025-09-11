"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Lock, User, Phone, Building2, UserCheck, CheckCircle, MailOpen } from "lucide-react"
import { useForm } from "react-hook-form"
import { PasswordStrength } from "@/components/ui/password-strength"
import { validatePassword, sanitizeAuthInput, validateEmail } from "@/lib/auth/middleware"

// Organization types ordered by character count (shortest to longest)
const ORGANIZATION_TYPES = [
  "PCYC",
  "YMCA", 
  "TAFE",
  "Camp",
  "School",
  "Academy",
  "College",
  "Council",
  "University",
  "Sports Club",
  "Association",
  "Youth Center",
  "Basketball Club",
  "Community Center",
  "Charity Foundation"
]

// Coach experience levels
const EXPERIENCE_LEVELS = [
  "Beginner Coach (0-2 years)",
  "Experienced Coach (3-5 years)", 
  "Senior Coach (6-10 years)",
  "Elite Coach (10+ years)"
]

// Sydney basketball coaching locations
const LOCATION_PREFERENCES = [
  "Inner West Sydney",
  "Eastern Suburbs", 
  "Western Sydney",
  "Northern Beaches",
  "South Sydney",
  "Central Coast"
]

// Coaching availability options
const AVAILABILITY_OPTIONS = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings", 
  "Saturday Mornings",
  "Saturday Afternoons",
  "Sunday Mornings",
  "Sunday Afternoons",
  "School Holidays"
]

interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  organizationType?: string // for organizations
  organizationName?: string // for organizations
  nickname?: string // for coaches
  experienceLevel?: string // for coaches
  locationPreferences?: string[] // for coaches
  availability?: string[] // for coaches
  phone?: string
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"org" | "coach">("org")
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([])
  const supabase = createClient()
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<SignUpForm>()
  const password = watch("password")
  
  // Set initial tab based on URL parameter
  useEffect(() => {
    const role = searchParams.get("role")
    if (role === "coach") {
      setActiveTab("coach")
    }
  }, [searchParams])
  
  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Validate inputs on client side
      const emailValidation = validateEmail(data.email)
      if (!emailValidation) {
        setError("Please enter a valid email address")
        return
      }
      
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        setError(`Password requirements not met: ${passwordValidation.errors[0]}`)
        return
      }
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeAuthInput(data.email)
      const sanitizedFirstName = sanitizeAuthInput(data.firstName)
      const sanitizedLastName = sanitizeAuthInput(data.lastName)
      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`
      
      // Prepare role-specific metadata
      const metadata: any = {
        role: activeTab,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        name: fullName, // Keep for compatibility
        phone: data.phone ? sanitizeAuthInput(data.phone) : null,
      }
      
      // Add role-specific fields
      if (activeTab === "org") {
        if (data.organizationType) {
          metadata.organizationType = sanitizeAuthInput(data.organizationType)
        }
        if (data.organizationName) {
          metadata.organizationName = sanitizeAuthInput(data.organizationName)
        }
      } else if (activeTab === "coach") {
        if (data.nickname) {
          metadata.nickname = sanitizeAuthInput(data.nickname)
        }
        if (data.experienceLevel) {
          metadata.experienceLevel = sanitizeAuthInput(data.experienceLevel)
        }
        if (selectedLocations.length > 0) {
          metadata.locationPreferences = selectedLocations
        }
        if (selectedAvailability.length > 0) {
          metadata.availability = selectedAvailability
        }
      }
      
      // Sign up the user with metadata for the trigger
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: data.password,
        options: {
          data: metadata
        }
      })
      
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      
      if (!authData.user) {
        setError("Failed to create account")
        return
      }
      
      // The user record is automatically created by the database trigger
      // We don't need to manually insert it here
      
      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at) {
        // Show email confirmation message instead of redirecting
        setUserEmail(sanitizedEmail)
        setShowEmailConfirmation(true)
        setIsLoading(false)
        return
      }
      
      // If email is already confirmed (unlikely for new signups), redirect
      if (activeTab === "org") {
        router.push('/org/dashboard')
      } else {
        router.push('/coach/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
        
        <GlassCard className="p-8">
          {showEmailConfirmation ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <MailOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground mb-6">
                We've sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{userEmail}</span>
              </p>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-left">
                    Click the confirmation link in your email to activate your account
                  </p>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-left">
                    Once confirmed, return here and sign in with your credentials
                  </p>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <Button 
                  onClick={() => router.push('/auth/sign-in')}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowEmailConfirmation(false)
                    setUserEmail("")
                    reset()
                  }}
                  className="w-full"
                >
                  Sign up with different email
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-6">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">
                  Join CoachFlow to connect with the basketball community
                </p>
              </div>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "org" | "coach")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="org" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="coach" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Coach
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="org">
              <p className="text-sm text-muted-foreground mb-6">
                Sign up to find verified basketball coaches for your organization
              </p>
            </TabsContent>
            
            <TabsContent value="coach">
              <p className="text-sm text-muted-foreground mb-6">
                Sign up to offer your coaching services to organizations
              </p>
            </TabsContent>
          </Tabs>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* First Name - Required for both */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="pl-10"
                  {...register("firstName", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters"
                    }
                  })}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name - Required for both */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="pl-10"
                  {...register("lastName", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters"
                    }
                  })}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            {/* Conditional Fields: Organization Type and Name for Orgs */}
            {activeTab === "org" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Organization Type</Label>
                  <Select
                    onValueChange={(value) => {
                      // Update form value manually for react-hook-form
                      const event = { target: { name: "organizationType", value } }
                      // Register the field if not already registered
                      register("organizationType", {
                        required: "Organization type is required"
                      })
                      // Set the value
                      setValue("organizationType", value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.organizationType && (
                    <p className="text-sm text-destructive">{errors.organizationType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="e.g., Bankstown Eagles, Sydney Central, etc."
                      className="pl-10"
                      {...register("organizationName", {
                        required: "Organization name is required",
                        minLength: {
                          value: 2,
                          message: "Organization name must be at least 2 characters"
                        }
                      })}
                    />
                  </div>
                  {errors.organizationName && (
                    <p className="text-sm text-destructive">{errors.organizationName.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Conditional Fields: All Coach Fields */}
            {activeTab === "coach" && (
              <>
                {/* Nickname for Coaches (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="Coach Mike, Johnny, etc."
                      className="pl-10"
                      {...register("nickname", {
                        minLength: {
                          value: 2,
                          message: "Nickname must be at least 2 characters"
                        }
                      })}
                    />
                  </div>
                  {errors.nickname && (
                    <p className="text-sm text-destructive">{errors.nickname.message}</p>
                  )}
                </div>

                {/* Experience Level for Coaches */}
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select
                    onValueChange={(value) => {
                      register("experienceLevel", {
                        required: "Experience level is required"
                      })
                      setValue("experienceLevel", value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.experienceLevel && (
                    <p className="text-sm text-destructive">{errors.experienceLevel.message}</p>
                  )}
                </div>

                {/* Location Preferences for Coaches */}
                <div className="space-y-3">
                  <Label>Location Preferences (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {LOCATION_PREFERENCES.map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location}`}
                          checked={selectedLocations.includes(location)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLocations([...selectedLocations, location])
                            } else {
                              setSelectedLocations(selectedLocations.filter(l => l !== location))
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`location-${location}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability for Coaches */}
                <div className="space-y-3">
                  <Label>Availability (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {AVAILABILITY_OPTIONS.map((time) => (
                      <div key={time} className="flex items-center space-x-2">
                        <Checkbox
                          id={`availability-${time}`}
                          checked={selectedAvailability.includes(time)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAvailability([...selectedAvailability, time])
                            } else {
                              setSelectedAvailability(selectedAvailability.filter(t => t !== time))
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`availability-${time}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {time}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register("email", {
                    required: "Email is required",
                    validate: (value) => {
                      if (!validateEmail(value)) {
                        return "Please enter a valid email address"
                      }
                      return true
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  className="pl-10"
                  {...register("phone", {
                    pattern: {
                      value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                      message: "Invalid phone number"
                    }
                  })}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register("password", {
                    required: "Password is required",
                    validate: (value) => {
                      const validation = validatePassword(value)
                      if (!validation.isValid) {
                        return validation.errors[0]
                      }
                      if (validation.strength === 'weak') {
                        return "Password is too weak - please make it stronger"
                      }
                      return true
                    }
                  })}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              
              {/* Password strength indicator */}
              {password && (
                <PasswordStrength password={password} className="mt-2" />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: value => value === password || "Passwords don't match"
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : `Sign up as ${activeTab === "org" ? "Organization" : "Coach"}`}
              </Button>
            </div>
          </form>
          
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link 
                  href="/auth/sign-in" 
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
