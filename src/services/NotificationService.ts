/**
 * @file NotificationService.ts
 * Singleton service for pushing toast notifications from anywhere in the app
 * (services, stores, components) without coupling to React.
 *
 * Usage:
 *   NotificationService.success('Projet sauvegardé')
 *   NotificationService.error('Impossible de charger le fichier')
 *   NotificationService.warning('Format non reconnu, import partiel')
 */
import { useNotificationStore } from '../stores/useNotificationStore'
import type { NotifType } from '../stores/useNotificationStore'

function push(message: string, type: NotifType): void {
  useNotificationStore.getState().push(message, type)
}

export const NotificationService = {
  success: (message: string) => push(message, 'success'),
  error:   (message: string) => push(message, 'error'),
  warning: (message: string) => push(message, 'warning'),
}
