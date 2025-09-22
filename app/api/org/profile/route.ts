import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/utils'

export async function PUT(request: NextRequest) {
  try {
    // Authenticate and verify org role
    const user = await requireRole('org')
    const supabase = await createServerSupabaseClient()

    // Get request body
    const body = await request.json()
    console.log('Profile update request:', body)

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('org_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking profile:', checkError)
      return NextResponse.json(
        { error: 'Failed to check profile existence' },
        { status: 500 }
      )
    }

    let result

    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('org_profiles')
        .update(body)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Create new profile
      result = await supabase
        .from('org_profiles')
        .insert({ ...body, user_id: user.id })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Profile save error:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Failed to save profile' },
        { status: 500 }
      )
    }

    console.log('Profile saved successfully:', result.data)
    return NextResponse.json({ data: result.data })

  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to update profile',
        details: error
      },
      { status: 500 }
    )
  }
}