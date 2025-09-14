"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, Bell, ExternalLink, Mail, Phone } from "lucide-react"
import type { Notification } from "@/lib/types/notifications"

interface NotificationToastProps {
  notification: Notification
  onClose: () => void
  onAction?: () => void
}

export function NotificationToast({
  notification,
  onClose,
  onAction
}: NotificationToastProps) {
  const categoryConfig = {
    application: { icon: "📋", color: "bg-blue-500" },
    booking: { icon: "📅", color: "bg-green-500" },
    listing: { icon: "📝", color: "bg-purple-500" },
    profile: { icon: "👤", color: "bg-orange-500" },
    system: { icon: "🔧", color: "bg-gray-500" }
  }

  const config = categoryConfig[notification.category]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      className="relative"
    >
      <div className="glass rounded-xl shadow-2xl p-4 min-w-[350px] max-w-[450px] border border-white/20">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            config.color
          )}>
            <span className="text-lg">{config.icon}</span>
          </div>

          <div className="flex-1">
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.body}
            </p>

            {/* Contact Details */}
            {notification.metadata?.contact_details && (
              <div className="flex gap-3 mt-2">
                {notification.metadata.contact_details.email && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `mailto:${notification.metadata.contact_details.email}`
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                )}
                {notification.metadata.contact_details.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `tel:${notification.metadata.contact_details.phone}`
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </button>
                )}
              </div>
            )}

            {/* Action Button */}
            {notification.metadata?.action_url && (
              <button
                onClick={() => {
                  onAction?.()
                  window.location.href = notification.metadata.action_url!
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                View Details
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Priority Indicator */}
        {notification.priority === "high" && (
          <div className="absolute -top-1 -left-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}

        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary/30 rounded-b-xl"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
        />
      </div>
    </motion.div>
  )
}

interface NotificationToastContainerProps {
  notifications: Notification[]
  onClose: (id: string) => void
  onAction?: (id: string) => void
}

export function NotificationToastContainer({
  notifications,
  onClose,
  onAction
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => onClose(notification.id)}
            onAction={() => onAction?.(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}