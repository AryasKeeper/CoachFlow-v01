"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  Filter,
  Search,
  X,
  Loader2,
  Inbox,
  Clock,
  AlertCircle
} from "lucide-react"
import type { Notification, notificationConfig, priorityConfig } from "@/lib/types/notifications"

interface NotificationCenterProps {
  user: any
}

export function NotificationCenter({ user }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all")
  const [category, setCategory] = useState<string>("all")
  const supabase = createClient()

  // Load notifications
  useEffect(() => {
    loadNotifications()
    subscribeToNotifications()
  }, [filter, category])

  const loadNotifications = async () => {
    setLoading(true)

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filter === "unread") {
      query = query.is("read_at", null)
    } else if (filter === "archived") {
      query = query.not("archived_at", "is", null)
    } else {
      query = query.is("archived_at", null)
    }

    if (category !== "all") {
      query = query.eq("category", category)
    }

    const { data, error } = await query.limit(50)

    if (!error && data) {
      setNotifications(data)
      const unread = data.filter(n => !n.read_at && !n.archived_at).length
      setUnreadCount(unread)
    }

    setLoading(false)
  }

  // Real-time subscription
  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show toast notification
          showToastNotification(newNotification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showToastNotification = (notification: Notification) => {
    // This would be a toast component in production
    console.log("New notification:", notification.title)
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)

    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  const archiveNotification = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (filter !== "archived") {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)

    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.metadata?.action_url) {
      window.location.href = notification.metadata.action_url
      setOpen(false)
    }
  }

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    notifications.forEach(notification => {
      const date = new Date(notification.created_at)
      let key: string

      if (date.toDateString() === today.toDateString()) {
        key = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday"
      } else if (date > new Date(today.setDate(today.getDate() - 7))) {
        key = "This Week"
      } else {
        key = "Earlier"
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(notification)
    })

    return groups
  }

  const groupedNotifications = groupNotificationsByDate(notifications)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-white/10"
          >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge className="h-5 min-w-[20px] px-1 bg-red-500 border-0">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[450px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Filters */}
          <div className="px-6 py-3 border-b bg-muted/30">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Filter */}
          <div className="px-6 py-2 border-b">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant={category === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategory("all")}
              >
                All
              </Badge>
              {["application", "booking", "listing", "profile", "system"].map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap capitalize"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "Your notification inbox is empty"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    <div className="px-6 py-2 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">
                        {date}
                      </p>
                    </div>
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onArchive={() => archiveNotification(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onArchive: () => void
  onDelete: () => void
}

function NotificationItem({
  notification,
  onClick,
  onArchive,
  onDelete
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false)
  const categoryConfig = {
    application: { icon: "📋", color: "text-blue-600", bgColor: "bg-blue-50" },
    booking: { icon: "📅", color: "text-green-600", bgColor: "bg-green-50" },
    listing: { icon: "📝", color: "text-purple-600", bgColor: "bg-purple-50" },
    profile: { icon: "👤", color: "text-orange-600", bgColor: "bg-orange-50" },
    system: { icon: "🔧", color: "text-gray-600", bgColor: "bg-gray-50" }
  }

  const config = categoryConfig[notification.category]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors relative group",
        !notification.read_at && "bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bgColor
        )}>
          <span className="text-lg">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "font-medium text-sm",
                !notification.read_at && "font-semibold"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {notification.body}
              </p>

              {/* Contact Details (if accepted) */}
              {notification.metadata?.contact_details && (
                <div className="flex gap-3 mt-2">
                  {notification.metadata.contact_details.email && (
                    <a
                      href={`mailto:${notification.metadata.contact_details.email}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                  {notification.metadata.contact_details.phone && (
                    <a
                      href={`tel:${notification.metadata.contact_details.phone}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true
                  })}
                </span>
                {notification.priority === "high" && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    Important
                  </Badge>
                )}
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.read_at && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 right-2 flex gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive()
                  }}
                >
                  <Archive className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}