// Simple env configuration for development
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'CoachFlow',
}

// Warn if using placeholder values in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    console.warn('⚠️  Using placeholder Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.')
  }
  if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-anon-key') {
    console.warn('⚠️  Using placeholder Supabase key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
  }
}
