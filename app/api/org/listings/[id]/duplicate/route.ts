import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/utils'

// Duplicate listing endpoint
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required in Next.js 15
    const params = await context.params
    const listingId = params.id

    // Authenticate and verify org role
    const user = await requireRole('org')
    const supabase = await createServerSupabaseClient()

    console.log('Listing duplicate request:', { listingId, userId: user.id })

    // Get the original listing
    const { data: originalListing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('org_id', user.id)
      .single()

    if (fetchError || !originalListing) {
      console.error('Original listing not found:', fetchError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Create a duplicate with modified title and reset status
    const duplicateData = {
      ...originalListing,
      id: undefined, // Let database generate new ID
      title: `${originalListing.title} (Copy)`,
      status: 'draft', // Start as draft so they can review before publishing
      created_at: undefined // Let database set new timestamp
    }

    // Remove fields that shouldn't be duplicated
    delete duplicateData.id
    delete duplicateData.created_at

    // Insert the duplicate
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert(duplicateData)
      .select()
      .single()

    if (insertError) {
      console.error('Duplicate creation error:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to duplicate listing' },
        { status: 500 }
      )
    }

    console.log('Listing duplicated successfully:', newListing)
    return NextResponse.json({ data: newListing })

  } catch (error: any) {
    console.error('Listing duplicate error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to duplicate listing',
        details: error
      },
      { status: 500 }
    )
  }
}