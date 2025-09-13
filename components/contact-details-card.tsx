"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Globe,
  User,
  Building2,
  Eye,
  EyeOff,
  Copy,
  Check
} from "lucide-react"

interface ContactDetailsCardProps {
  contactInfo: {
    name?: string
    email?: string
    phone?: string
    preferredContact?: string
    linkedin?: string
    website?: string
    location?: string
    title?: string
    organization?: string
  }
  type: 'coach' | 'org'
  isRevealed: boolean
}

export function ContactDetailsCard({ contactInfo, type, isRevealed }: ContactDetailsCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isRevealed) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <EyeOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Contact Details Hidden</h3>
          <p className="text-sm text-muted-foreground">
            Contact information will be revealed once the application is accepted
          </p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {type === 'coach' ? (
            <User className="w-5 h-5 text-primary" />
          ) : (
            <Building2 className="w-5 h-5 text-primary" />
          )}
          <h3 className="font-semibold">Contact Information</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              View
            </>
          )}
        </Button>
      </div>

      {showDetails && (
        <div className="space-y-4">
          {contactInfo.name && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{contactInfo.name}</span>
                {contactInfo.title && (
                  <Badge variant="secondary" className="text-xs">
                    {contactInfo.title}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {contactInfo.email && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {contactInfo.email}
                </a>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(contactInfo.email!, 'email')}
              >
                {copiedField === 'email' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}

          {contactInfo.phone && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {contactInfo.phone}
                </a>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(contactInfo.phone!, 'phone')}
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}

          {contactInfo.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contactInfo.location}</span>
            </div>
          )}

          {contactInfo.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground" />
              <a
                href={contactInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}

          {contactInfo.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a
                href={contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Website
              </a>
            </div>
          )}

          {contactInfo.preferredContact && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Preferred Contact Method</p>
              <Badge variant="outline">
                {contactInfo.preferredContact === 'email' && <Mail className="w-3 h-3 mr-1" />}
                {contactInfo.preferredContact === 'phone' && <Phone className="w-3 h-3 mr-1" />}
                {contactInfo.preferredContact === 'both' ? 'Email or Phone' : contactInfo.preferredContact}
              </Badge>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}