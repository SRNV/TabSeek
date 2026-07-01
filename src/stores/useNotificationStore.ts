/**
 * @file useNotificationStore.ts
 * Zustand store for the notification queue.
 * Written by NotificationService; read by NotificationStack.
 */
import { create } from 'zustand'

export type NotifType = 'success' | 'error' | 'warning'

export interface AppNotification {
  id: string
  message: string
  type: NotifType
}

interface NotificationState {
  notifications: AppNotification[]
  push: (message: string, type: NotifType) => void
  dismiss: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  push: (message, type) =>
    set(state => ({
      notifications: [
        ...state.notifications,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, type },
      ],
    })),

  dismiss: (id) =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),
}))
