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
import { ArrowLeft, Mail, Lock, User, Phone, Building2, UserCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { PasswordStrength } from "@/components/ui/password-strength"
import { validatePassword, sanitizeAuthInput, validateEmail } from "@/lib/auth/middleware"

interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  phone?: string
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"org" | "coach">("org")
  const supabase = createClient()
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<SignUpForm>()
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
      const sanitizedName = sanitizeAuthInput(data.name)
      
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: data.password,
      })
      
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      
      if (!authData.user) {
        setError("Failed to create account")
        return
      }
      
      // Create user record with role
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: sanitizedEmail,
          name: sanitizedName,
          phone: data.phone ? sanitizeAuthInput(data.phone) : null,
          role: activeTab,
        })
        
      if (userError) {
        setError("Failed to create user profile")
        return
      }
      
      // Redirect based on role
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
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters"
                    }
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
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
        </GlassCard>
      </div>
    </div>
  )
}
