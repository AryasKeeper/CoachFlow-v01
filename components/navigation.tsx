"use client"

import Link from "next/link"
import { OptimizedLink } from "./optimized-link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  X,
  User,
  ChevronDown,
  LayoutDashboard,
  Settings,
  LogOut
} from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle, ThemeToggleMobile } from "@/components/theme/theme-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  label: string
  href: string
}

const publicNavItems: NavItem[] = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'coach' | 'org' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  // Check authentication state
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Get user role from the database
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role as 'coach' | 'org')
        }
      }
      
      setIsLoading(false)
    }
    
    getUser()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      
      // Get user role when auth state changes
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role as 'coach' | 'org')
        }
      } else {
        setUserRole(null)
      }
      
      setIsLoading(false)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth, supabase])
  
  const isAuthPage = pathname?.startsWith("/auth")
  const isDashboard = pathname?.includes("/dashboard")
  const isLoggedIn = !!user
  
  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
      isScrolled ? "glass shadow-soft" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-semibold">CoachFlow</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Center - Show only when logged in */}
            {isLoggedIn && !isLoading && (
              <NotificationCenter user={user} />
            )}

            {!isAuthPage && (
              <>
                {isLoading ? null : !isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <OptimizedLink href="/auth/sign-in">Sign In</OptimizedLink>
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                      <OptimizedLink href="/auth/sign-up">Sign Up</OptimizedLink>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {isDashboard && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200">
                        Free during beta
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="flex items-center space-x-2 hover:bg-accent"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">{user?.email}</span>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => router.push(userRole === 'coach' ? '/coach/dashboard' : '/org/dashboard')}
                          className="cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(userRole === 'coach' ? '/coach/profile' : '/org/profile')}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(userRole === 'coach' ? '/coach/settings' : '/org/settings')}
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onSelect={async (e) => {
                            e.preventDefault()
                            try {
                              await supabase.auth.signOut()
                              localStorage.clear()
                              sessionStorage.clear()
                              window.location.href = '/'
                            } catch (err) {
                              console.error('Sign out error:', err)
                              window.location.href = '/'
                            }
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block py-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              
              {!isAuthPage && (
                <div className="space-y-2 pt-4 border-t">
                  {isLoading ? null : !isLoggedIn ? (
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/auth/sign-in">Sign In</Link>
                      </Button>
                      <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                        <Link href="/auth/sign-up">Sign Up</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-end gap-2 mb-2">
                        <NotificationCenter user={user} />
                        <ThemeToggleMobile />
                      </div>
                      {isDashboard && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200 w-full justify-center">
                          Free during beta
                        </Badge>
                      )}
                      <div className="flex items-center justify-between px-2 py-2 bg-muted/50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">{user?.email}</span>
                        </div>
                        <ThemeToggleMobile />
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push(userRole === 'coach' ? '/coach/dashboard' : '/org/dashboard')
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push(userRole === 'coach' ? '/coach/profile' : '/org/profile')
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push(userRole === 'coach' ? '/coach/settings' : '/org/settings')
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={async () => {
                          try {
                            await supabase.auth.signOut()
                            localStorage.clear()
                            sessionStorage.clear()
                            window.location.href = '/'
                          } catch (err) {
                            console.error('Sign out error:', err)
                            window.location.href = '/'
                          }
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
