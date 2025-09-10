import { SectionHeader } from "@/components/ui/section-header"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, X, ArrowRight } from "lucide-react"

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  notIncluded?: string[]
  cta: string
  href: string
  popular?: boolean
}

export default function PricingPage() {
  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Post up to 3 active listings",
        "View coach profiles and certifications",
        "Direct messaging with coaches",
        "Basic search and filters",
        "Email notifications",
      ],
      notIncluded: [
        "Priority support",
        "Advanced analytics",
        "Bulk posting tools",
      ],
      cta: "Get Started",
      href: "/auth/sign-up?role=org",
    },
    {
      name: "Pro",
      price: "$0", // Will be $49/month after beta
      description: "For active organizations",
      features: [
        "Unlimited active listings",
        "Priority in coach searches",
        "Advanced filters and search",
        "Booking management tools",
        "Analytics dashboard",
        "Priority email support",
        "Bulk posting and templates",
      ],
      cta: "Start Pro (Free)",
      href: "/auth/sign-up?role=org&plan=pro",
      popular: true,
    },
    {
      name: "Business",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Multiple team seats",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom reporting",
        "White-label options",
      ],
      cta: "Contact Sales",
      href: "/contact-sales",
    },
  ]
  
  const coachPricing = {
    name: "Coach Membership",
    price: "$0", // Will be $9.99/month after beta
    description: "For basketball coaches",
    features: [
      "Create professional profile",
      "Upload certifications",
      "Apply to unlimited opportunities",
      "Set your own rates",
      "Availability calendar",
      "Direct messaging",
      "Mobile app access (coming soon)",
    ],
  }
  
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-2">🎉</span>
            Free during beta - No credit card required
          </Badge>
          <SectionHeader
            title="Simple, Transparent Pricing"
            subtitle="Choose the plan that works for your organization"
          />
        </div>
        
        {/* Organization Pricing */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {tiers.map((tier) => (
            <GlassCard
              key={tier.name}
              className={`relative ${
                tier.popular ? "ring-2 ring-primary shadow-soft-lg scale-105" : ""
              }`}
              noPadding
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold">
                      {tier.price}
                      {tier.price !== "Custom" && <span className="text-base font-normal text-muted-foreground">/month</span>}
                    </p>
                    {tier.price === "$0" && (
                      <p className="text-sm text-muted-foreground">Free during beta</p>
                    )}
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>
                
                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {tier.notIncluded?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 opacity-50">
                      <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm line-through">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={tier.href}>
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
        
        {/* Coach Pricing */}
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            title="For Coaches"
            subtitle="Everything you need to grow your coaching career"
            align="center"
            className="mb-8"
          />
          
          <GlassCard className="p-8">
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-2xl font-bold">{coachPricing.name}</h3>
              <div className="space-y-1">
                <p className="text-4xl font-bold">
                  {coachPricing.price}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <p className="text-sm text-muted-foreground">Free during beta, then $9.99/month</p>
              </div>
              <p className="text-muted-foreground">{coachPricing.description}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {coachPricing.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up?role=coach">
                  Join as a Coach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <SectionHeader
            title="Frequently Asked Questions"
            align="center"
            className="mb-8"
          />
          
          <div className="space-y-6">
            <GlassCard>
              <h4 className="font-semibold mb-2">When will you start charging?</h4>
              <p className="text-muted-foreground">
                We're currently in beta and all features are free. We'll give at least 30 days notice before introducing paid plans, and beta users will receive special discounts.
              </p>
            </GlassCard>
            
            <GlassCard>
              <h4 className="font-semibold mb-2">Are there any transaction fees?</h4>
              <p className="text-muted-foreground">
                No! CoachFlow doesn't charge any transaction fees. Organizations and coaches negotiate rates directly, and payments happen outside our platform.
              </p>
            </GlassCard>
            
            <GlassCard>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.
              </p>
            </GlassCard>
            
            <GlassCard>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-muted-foreground">
                When we start charging, we'll accept all major credit cards, debit cards, and bank transfers for Business plans.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
