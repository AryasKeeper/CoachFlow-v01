"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  userRole: 'coach' | 'org' | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {}
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'coach' | 'org' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Optimistically load from localStorage first for instant UI
  useEffect(() => {
    const storedUser = localStorage.getItem('sb-user')
    const storedRole = localStorage.getItem('sb-user-role')

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setUserRole(storedRole as 'coach' | 'org' | null)
        // Don't set loading to false yet - still validate with server
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
  }, [])

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (data) {
        setUserRole(data.role as 'coach' | 'org')
        localStorage.setItem('sb-user-role', data.role)
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          localStorage.setItem('sb-user', JSON.stringify(session.user))
          await fetchUserRole(session.user.id)
        } else {
          setUser(null)
          setUserRole(null)
          localStorage.removeItem('sb-user')
          localStorage.removeItem('sb-user-role')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)

      if (session?.user) {
        setUser(session.user)
        localStorage.setItem('sb-user', JSON.stringify(session.user))
        await fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setUserRole(null)
        localStorage.removeItem('sb-user')
        localStorage.removeItem('sb-user-role')
      }

      // Handle sign out event
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserRole, router])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()

      // Clear state
      setUser(null)
      setUserRole(null)

      // Force redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even on error
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}