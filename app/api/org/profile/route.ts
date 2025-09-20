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

    // Remove facility_features temporarily if the column doesn't exist
    const { facility_features, ...profileDataWithoutFeatures } = body

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

    // Try to save with all fields first
    try {
      if (existingProfile) {
        // Update existing profile - try with all fields
        result = await supabase
          .from('org_profiles')
          .update(body)
          .eq('user_id', user.id)
          .select()
          .single()
      } else {
        // Create new profile - try with all fields
        result = await supabase
          .from('org_profiles')
          .insert({ ...body, user_id: user.id })
          .select()
          .single()
      }

      if (result.error) throw result.error

    } catch (fullError: any) {
      console.log('Full save failed, trying without facility_features:', fullError.message)

      // If it fails due to missing column, try without facility_features
      if (fullError.message?.includes('facility_features')) {
        if (existingProfile) {
          result = await supabase
            .from('org_profiles')
            .update(profileDataWithoutFeatures)
            .eq('user_id', user.id)
            .select()
            .single()
        } else {
          result = await supabase
            .from('org_profiles')
            .insert({ ...profileDataWithoutFeatures, user_id: user.id })
            .select()
            .single()
        }

        if (result.error) {
          console.error('Save without features failed:', result.error)
          throw result.error
        }

        // Return with a warning about facility features
        return NextResponse.json({
          data: result.data,
          warning: 'Facility features could not be saved due to database schema limitations.'
        })
      } else {
        // Re-throw if it's a different error
        throw fullError
      }
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