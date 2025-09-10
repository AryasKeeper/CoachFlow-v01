import dynamic from "next/dynamic"
import { SectionHeader } from "@/components/ui/section-header"
import { StepCard } from "@/components/ui/step-card"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle, Shield, Users, Zap, Calendar, MessageSquare, Award } from "lucide-react"

// Dynamic imports for code splitting
const HeroRotator = dynamic(
  () => import("@/components/ui/hero-rotator").then(mod => ({ default: mod.HeroRotator })),
  {
    loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded-lg" />
  }
)

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <span className="mr-2">🎉</span>
              Free during beta
            </Badge>
            
            <HeroRotator />
            
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Local, verified, on-demand coaching talent across Sydney—often in under 24 hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up?role=org">
                  Find Coaches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/sign-up?role=coach">
                  Join as Coach
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Verified coaches</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Background checked</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span>Quick matching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <HowItWorksSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="How It Works"
          subtitle="Get matched with the perfect coach in three simple steps"
        />
        
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* For Organizations */}
          <div className="space-y-6">
            <h3 className="text-h3 text-center mb-8">For Organizations</h3>
            <StepCard
              number={1}
              title="Post Your Need"
              description="Describe your coaching requirements, schedule, and location. Specify any required certifications."
            />
            <StepCard
              number={2}
              title="Review Applications"
              description="Receive applications from verified coaches. Compare profiles, rates, and qualifications."
            />
            <StepCard
              number={3}
              title="Book & Connect"
              description="Select your preferred coach and confirm the booking. Start your coaching sessions."
            />
          </div>
          
          {/* For Coaches */}
          <div className="space-y-6">
            <h3 className="text-h3 text-center mb-8">For Coaches</h3>
            <StepCard
              number={1}
              title="Create Profile"
              description="Sign up and build your coaching profile. Upload certifications and set your availability."
            />
            <StepCard
              number={2}
              title="Browse Opportunities"
              description="View coaching opportunities in your area. Filter by location, schedule, and compensation."
            />
            <StepCard
              number={3}
              title="Apply & Coach"
              description="Submit applications with your proposed rate. Get booked and start coaching."
            />
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Button asChild>
            <Link href="/how-it-works">
              Learn More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: "Verified Coaches",
      description: "All coaches undergo background checks, certification verification, and profile review."
    },
    {
      icon: Zap,
      title: "Quick Matching",
      description: "Find qualified coaches in your area, often within 24 hours of posting."
    },
    {
      icon: Users,
      title: "Local Network",
      description: "Connect with coaches who know your community and can travel to your location."
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Book coaches for one-time sessions, regular training, or camp coverage."
    },
    {
      icon: MessageSquare,
      title: "Direct Communication",
      description: "Message coaches directly to discuss requirements and expectations."
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Rate coaches after sessions to help maintain high standards."
    }
  ]

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Why Choose CoachFlow"
          subtitle="The trusted platform for basketball coaching connections"
        />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <GlassCard key={index} className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      rating: 5,
      text: "Found an amazing coach for our youth program within 48 hours. The verification process gave us confidence in our choice.",
      author: "Sarah Chen",
      role: "Youth Basketball Academy"
    },
    {
      rating: 5,
      text: "As a coach, I love the flexibility and variety of opportunities. The platform makes it easy to find work that fits my schedule.",
      author: "Marcus Thompson",
      role: "Professional Basketball Coach"
    },
    {
      rating: 5,
      text: "Perfect for finding last-minute coverage. We had a coach cancel and found a qualified replacement the same day.",
      author: "David Park",
      role: "Community Sports Center"
    }
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="What People Are Saying"
          subtitle="Join hundreds of satisfied organizations and coaches"
        />
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <GlassCard key={index}>
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-2">🚀</span>
            Free during beta - No credit card required
          </Badge>
          
          <h2 className="text-h2">Ready to Get Started?</h2>
          <p className="text-body-lg text-muted-foreground">
            Join Sydney's growing network of basketball organizations and coaches.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-semibold">CoachFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting Sydney's basketball community
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/auth/sign-up?role=org" className="hover:text-foreground">For Organizations</Link></li>
              <li><Link href="/auth/sign-up?role=coach" className="hover:text-foreground">For Coaches</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground">Safety</a></li>
              <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 CoachFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}