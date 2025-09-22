import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/utils'

// Update listing
export async function PUT(
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

    // Get request body
    const body = await request.json()
    console.log('Listing update request:', { listingId, userId: user.id })

    // Verify ownership of the listing
    const { data: existingListing, error: checkError } = await supabase
      .from('listings')
      .select('org_id')
      .eq('id', listingId)
      .single()

    if (checkError || !existingListing) {
      console.error('Listing not found:', checkError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (existingListing.org_id !== user.id) {
      console.error('Unauthorized: User does not own this listing')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update the listing (remove updated_at as it doesn't exist in schema)
    const { data, error } = await supabase
      .from('listings')
      .update({
        title: body.title,
        description: body.description,
        location: body.location,
        suburbs: body.suburbs,
        dates: body.dates,
        time_intervals: body.time_intervals,
        pay_min: body.pay_min,
        pay_max: body.pay_max,
        required_badges: body.required_badges,
        urgency: body.urgency,
        gender_preference: body.gender_preference
      })
      .eq('id', listingId)
      .eq('org_id', user.id) // Double-check ownership
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update listing' },
        { status: 500 }
      )
    }

    console.log('Listing updated successfully:', data)
    return NextResponse.json({ data })

  } catch (error: any) {
    console.error('Listing update error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to update listing',
        details: error
      },
      { status: 500 }
    )
  }
}

// Delete listing
export async function DELETE(
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

    console.log('Listing delete request:', { listingId, userId: user.id })

    // Verify ownership of the listing
    const { data: existingListing, error: checkError } = await supabase
      .from('listings')
      .select('org_id')
      .eq('id', listingId)
      .single()

    if (checkError || !existingListing) {
      console.error('Listing not found:', checkError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (existingListing.org_id !== user.id) {
      console.error('Unauthorized: User does not own this listing')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('org_id', user.id) // Double-check ownership

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete listing' },
        { status: 500 }
      )
    }

    console.log('Listing deleted successfully:', listingId)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Listing delete error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete listing',
        details: error
      },
      { status: 500 }
    )
  }
}