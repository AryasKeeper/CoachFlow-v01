import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditListingForm } from "./edit-listing-form"

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Await params as required in Next.js 15
  const { id } = await params

  // Fetch the listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('org_id', user.id) // Ensure user owns this listing
    .single()
  
  if (error || !listing) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>
      <EditListingForm listing={listing} />
    </div>
  )
}