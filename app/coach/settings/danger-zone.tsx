"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangle,
  Trash2,
  UserX,
  Download,
  Loader2
} from "lucide-react"

interface DangerZoneProps {
  user: any
}

export function DangerZone({ user }: DangerZoneProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleExportData = async () => {
    setLoading('export')
    try {
      // Export user data logic here
      toast.success('Your data export has been started. You will receive an email with the download link.')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setLoading(null)
    }
  }

  const handleDeactivateAccount = async () => {
    setLoading('deactivate')
    const supabase = createClient()

    try {
      // Deactivate account logic here
      toast.success('Your account has been deactivated')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      toast.error('Failed to deactivate account')
    } finally {
      setLoading(null)
      setShowDeactivateDialog(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading('delete')
    const supabase = createClient()

    try {
      // Delete account logic here
      toast.success('Your account has been permanently deleted')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setLoading(null)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          Danger Zone
        </h2>
        <p className="text-muted-foreground mt-1">
          Irreversible actions that affect your account
        </p>
      </div>

      <Separator className="border-red-200" />

      {/* Warning Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
      >
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Warning: These actions cannot be undone
            </p>
            <p className="text-sm text-red-800 dark:text-red-200">
              Please be certain before proceeding with any of the actions below.
              They will permanently affect your account and data.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Export Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div>
          <Label className="text-base">Export Your Data</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Download all your CoachFlow data including profile, bookings, and messages
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportData}
          disabled={loading === 'export'}
          className="gap-2"
        >
          {loading === 'export' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export All Data
        </Button>
      </motion.div>

      <Separator />

      {/* Deactivate Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div>
          <Label className="text-base">Deactivate Account</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Temporarily disable your account. You can reactivate it anytime by signing in.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDeactivateDialog(true)}
          disabled={loading === 'deactivate'}
          className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
        >
          <UserX className="w-4 h-4" />
          Deactivate Account
        </Button>
      </motion.div>

      <Separator />

      {/* Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div>
          <Label className="text-base text-red-600">Delete Account</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={loading === 'delete'}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account Permanently
        </Button>
      </motion.div>

      {/* Deactivate Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile will be hidden and you won't receive any new bookings or messages.
              You can reactivate your account anytime by signing back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading === 'deactivate' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete your account permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action cannot be undone. This will permanently:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete your profile and all personal information</li>
                <li>Remove all your bookings and applications</li>
                <li>Delete your message history</li>
                <li>Remove you from the CoachFlow platform</li>
              </ul>
              <p className="font-medium pt-2">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading === 'delete' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}