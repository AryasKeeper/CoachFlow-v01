"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationToastContainer } from "./notification-toast"
import type { Notification } from "@/lib/types/notifications"
import { useUser } from "@/hooks/use-user"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  toastNotifications: Notification[]
  addToastNotification: (notification: Notification) => void
  removeToastNotification: (id: string) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveNotification: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([])
  const supabase = createClient()
  const { user } = useUser()

  useEffect(() => {
    if (!user) return

    loadNotifications()
    const unsubscribe = subscribeToNotifications()

    return () => {
      unsubscribe()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      setNotifications(data)
      const unread = data.filter(n => !n.read_at).length
      setUnreadCount(unread)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return () => {}

    const channel = supabase
      .channel("global-notifications")
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

          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show toast notification
          addToastNotification(newNotification)

          // Play notification sound (if enabled)
          playNotificationSound()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification

          setNotifications(prev =>
            prev.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )

          // Update unread count
          refreshUnreadCount()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id

          setNotifications(prev => prev.filter(n => n.id !== deletedId))
          refreshUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const refreshUnreadCount = async () => {
    if (!user) return

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)
      .is("archived_at", null)

    setUnreadCount(count || 0)
  }

  const playNotificationSound = () => {
    // Only play if user has enabled sounds
    const audio = new Audio("/sounds/notification.mp3")
    audio.volume = 0.3
    audio.play().catch(() => {
      // Ignore errors (e.g., user hasn't interacted with page yet)
    })
  }

  const addToastNotification = (notification: Notification) => {
    setToastNotifications(prev => [...prev, notification])
  }

  const removeToastNotification = (id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )
      refreshUnreadCount()
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    }
  }

  const archiveNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      refreshUnreadCount()
    }
  }

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      refreshUnreadCount()
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    toastNotifications,
    addToastNotification,
    removeToastNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToastContainer
        notifications={toastNotifications}
        onClose={removeToastNotification}
        onAction={async (id) => {
          await markAsRead(id)
          removeToastNotification(id)
        }}
      />
    </NotificationContext.Provider>
  )
}