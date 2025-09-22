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

    // If only updating status (quick action), handle separately
    if (body.status && Object.keys(body).length === 1) {
      const { data, error } = await supabase
        .from('listings')
        .update({ status: body.status })
        .eq('id', listingId)
        .eq('org_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Status update error:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to update listing status' },
          { status: 500 }
        )
      }

      console.log('Listing status updated successfully:', data)
      return NextResponse.json({ data })
    }

    // Full update - update all fields except status
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
      .select('org_id, title, status')
      .eq('id', listingId)
      .single()

    console.log('Existing listing check:', {
      listingId,
      existingListing,
      checkError,
      userId: user.id
    })

    if (checkError || !existingListing) {
      console.error('Listing not found:', checkError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (existingListing.org_id !== user.id) {
      console.error('Unauthorized: User does not own this listing', {
        listingOrgId: existingListing.org_id,
        userId: user.id
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    console.log('Authorization passed, proceeding with delete...')

    // Delete the listing and return the deleted record to confirm
    console.log('Attempting to delete listing...')
    const { data: deletedListing, error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('org_id', user.id) // Double-check ownership
      .select()
      .single()

    console.log('Delete operation result:', {
      deletedListing,
      error,
      errorMessage: error?.message,
      errorDetails: error?.details
    })

    if (error) {
      console.error('Delete error:', error)
      // Check if it's a policy violation
      if (error.code === '42501' || error.message?.includes('policy')) {
        console.error('RLS Policy violation - user may not have delete permission')
        return NextResponse.json(
          { error: 'Permission denied - please ensure the delete policy is configured in Supabase' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Failed to delete listing' },
        { status: 500 }
      )
    }

    if (!deletedListing) {
      console.error('No listing was deleted - may not exist or not owned by user')
      // Try to verify if the listing still exists
      const { data: stillExists } = await supabase
        .from('listings')
        .select('id')
        .eq('id', listingId)
        .single()

      console.log('Verification check - listing still exists?', stillExists)

      return NextResponse.json(
        { error: 'Failed to delete listing - listing may not exist or RLS policy preventing deletion' },
        { status: 404 }
      )
    }

    console.log('Listing deleted successfully:', deletedListing)
    return NextResponse.json({ success: true, deleted: deletedListing })

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