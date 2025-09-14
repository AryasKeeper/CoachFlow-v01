import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface Listing {
  id: string
  title: string
  description: string | null
  location: string
  suburbs: string[]
  dates: Record<string, unknown>
  time_intervals: Array<{ start: string; end: string }>
  pay_min: number | null
  pay_max: number | null
  pay_details?: string
  urgency: string | null
  gender_preference: string | null
  status: string
  created_at: string
  org_id?: string
}

export function useListings() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['listings', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Listing[]
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

export function useCoachApplications(coachId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['applications', coachId],
    queryFn: async () => {
      if (!coachId) return []

      const { data, error } = await supabase
        .from('applications')
        .select('listing_id')
        .eq('coach_id', coachId)

      if (error) throw error
      return data || []
    },
    enabled: !!coachId,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useCoachProfile(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['coach-profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore "not found" errors
      return data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useApplyToListing() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ listingId, coachId }: { listingId: string; coachId: string }) => {
      const { data, error } = await supabase
        .from('applications')
        .insert([{ listing_id: listingId, coach_id: coachId }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch applications
      queryClient.invalidateQueries({ queryKey: ['applications', variables.coachId] })

      // Optimistically update the applications cache
      queryClient.setQueryData(['applications', variables.coachId], (old: Array<{ listing_id: string }> = []) => [
        ...old,
        { listing_id: variables.listingId }
      ])
    },
  })
}