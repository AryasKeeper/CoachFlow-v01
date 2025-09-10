"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionHeader } from "@/components/ui/section-header"
import { StepCard } from "@/components/ui/step-card"
import { GlassCard } from "@/components/ui/glass-card"
import { BadgeRow } from "@/components/ui/badge-row"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Building2, UserCheck } from "lucide-react"

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState("organizations")
  
  const trustBadges = [
    { label: "WWCC", status: "verified" as const },
    { label: "First Aid/CPR", status: "verified" as const },
    { label: "Insurance", status: "verified" as const },
  ]
  
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="How CoachFlow Works"
          subtitle="Everything you need to know about finding or becoming a coach"
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-12">
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              For Organizations
            </TabsTrigger>
            <TabsTrigger value="coaches" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              For Coaches
            </TabsTrigger>
          </TabsList>
          
          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
              <StepCard
                number={1}
                title="Create Your Account"
                description="Sign up as an organization and tell us about your basketball program, location, and coaching needs."
              />
              <StepCard
                number={2}
                title="Post Your Need"
                description="Create a listing with your requirements: dates, times, location, skill level, and any specific certifications needed."
              />
              <StepCard
                number={3}
                title="Review Applications"
                description="Receive applications from qualified coaches. Review their profiles, certifications, and proposed rates."
              />
            </div>
            
            <GlassCard className="p-8">
              <h3 className="text-h3 mb-4">What happens next?</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Once you've reviewed applications and found your ideal coach:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Accept the application to create a booking</li>
                  <li>Message the coach directly to coordinate details</li>
                  <li>Exchange contact information for ongoing communication</li>
                  <li>Rate your experience to help other organizations</li>
                </ul>
              </div>
            </GlassCard>
            
            <div className="space-y-6">
              <h3 className="text-h3">Organization Benefits</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard>
                  <h4 className="font-semibold mb-2">Verified Coaches</h4>
                  <p className="text-muted-foreground mb-4">
                    All coaches are required to provide:
                  </p>
                  <BadgeRow badges={trustBadges} />
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">Quick Turnaround</h4>
                  <p className="text-muted-foreground">
                    Most organizations receive applications within 24 hours. Perfect for last-minute needs or emergency coverage.
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">No Commitments</h4>
                  <p className="text-muted-foreground">
                    Book coaches for one-off sessions, short-term camps, or ongoing programs. No long-term contracts required.
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">Direct Communication</h4>
                  <p className="text-muted-foreground">
                    Message coaches directly through the platform to discuss requirements, expectations, and logistics.
                  </p>
                </GlassCard>
              </div>
            </div>
          </TabsContent>
          
          {/* Coaches Tab */}
          <TabsContent value="coaches" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
              <StepCard
                number={1}
                title="Create Your Profile"
                description="Sign up and build your coaching profile. Add your experience, specialties, and the areas you can travel to."
              />
              <StepCard
                number={2}
                title="Upload Credentials"
                description="Provide your WWCC number, insurance documents, First Aid certification, and ABN for verification."
              />
              <StepCard
                number={3}
                title="Set Your Availability"
                description="Choose your available days and times, set your rates, and specify how far you're willing to travel."
              />
            </div>
            
            <GlassCard className="p-8">
              <h3 className="text-h3 mb-4">Finding Coaching Opportunities</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Once your profile is complete and verified:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Browse available coaching opportunities in your area</li>
                  <li>Filter by location, dates, skill level, and pay rate</li>
                  <li>Apply to opportunities that match your expertise</li>
                  <li>Include a personalized message and your proposed rate</li>
                  <li>Get notified when organizations respond</li>
                </ul>
              </div>
            </GlassCard>
            
            <div className="space-y-6">
              <h3 className="text-h3">Coach Benefits</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard>
                  <h4 className="font-semibold mb-2">Flexible Schedule</h4>
                  <p className="text-muted-foreground">
                    Choose when and where you want to coach. Accept only the opportunities that fit your schedule.
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">Set Your Rates</h4>
                  <p className="text-muted-foreground">
                    Propose your own rates for each opportunity. Charge hourly or flat rates based on the engagement.
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">Build Your Reputation</h4>
                  <p className="text-muted-foreground">
                    Receive ratings and reviews from organizations. Build your profile to attract more opportunities.
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h4 className="font-semibold mb-2">Grow Your Network</h4>
                  <p className="text-muted-foreground">
                    Connect with schools, academies, and sports organizations across Sydney. Expand your coaching career.
                  </p>
                </GlassCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="text-center mt-16 space-y-6">
          <h3 className="text-h3">Ready to get started?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up?role=org">
                I Need a Coach
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/sign-up?role=coach">
                I Am a Coach
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
