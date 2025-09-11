import { requireRole } from "@/lib/auth/utils"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Building2, Mail, Phone, MapPin, Save } from "lucide-react"

export default async function OrgSettingsPage() {
  const user = await requireRole('org')
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Organization Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your organization profile and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Basic Information */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" placeholder="Enter organization name" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Input id="orgType" placeholder="e.g., School, Club, Academy" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Tell coaches about your organization..."
                rows={3}
              />
            </div>
          </div>
        </GlassCard>

        {/* Contact Information */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Contact Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email} disabled />
              <p className="text-sm text-muted-foreground">
                This is your login email and cannot be changed here
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" className="pl-10" placeholder="+61 400 000 000" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Location */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Location & Coverage</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suburbs">Service Areas (Suburbs)</Label>
              <Textarea 
                id="suburbs" 
                placeholder="List suburbs you operate in (e.g., Bondi, Surry Hills, Paddington)"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Enter suburbs separated by commas to help coaches find you
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
        
        {/* Coming Soon Notice */}
        <GlassCard className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Settings functionality is coming soon! For now, you can view your current information. 
            Profile editing will be available in the next update.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}