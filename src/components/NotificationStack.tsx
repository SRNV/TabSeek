/**
 * @file NotificationStack.tsx
 * Renders up to 3 toast notifications stacked at top-right.
 * Each auto-dismisses after 7 s; hovering pauses the countdown.
 * Injected once in App.tsx — receives notifications from useNotificationStore.
 */
import { useEffect, useRef, useState } from 'react'
import { useNotificationStore } from '../stores/useNotificationStore'
import type { AppNotification } from '../stores/useNotificationStore'
import './NotificationStack.scss'

const MAX_VISIBLE       = 3
const AUTO_DISMISS_MS   = 7000
const EXIT_ANIMATION_MS = 280

const ICONS: Record<AppNotification['type'], string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
}

// ── Item individuel ───────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onDismiss,
}: {
  notif: AppNotification
  onDismiss: (id: string) => void
}) {
  const [leaving, setLeaving]   = useState(false)
  const leavingRef               = useRef(false)
  const timerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerDismiss = () => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    setTimeout(() => onDismiss(notif.id), EXIT_ANIMATION_MS)
  }

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    timerRef.current = setTimeout(triggerDismiss, AUTO_DISMISS_MS)
  }

  useEffect(() => {
    startTimer()
    return () => clearTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`notif-item notif-${notif.type}${leaving ? ' notif-leaving' : ''}`}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
    >
      <span className="notif-icon">{ICONS[notif.type]}</span>
      <span className="notif-message">{notif.message}</span>
      <button
        type="button"
        className="notif-close"
        aria-label="Fermer"
        onClick={triggerDismiss}
      >
        ×
      </button>
    </div>
  )
}

// ── Conteneur ─────────────────────────────────────────────────────────────────

export default function NotificationStack() {
  const notifications = useNotificationStore(s => s.notifications)
  const dismiss       = useNotificationStore(s => s.dismiss)

  const visible = notifications.slice(-MAX_VISIBLE)
  if (visible.length === 0) return null

  return (
    <div className="notif-stack" role="status" aria-live="polite">
      {visible.map(n => (
        <NotificationItem key={n.id} notif={n} onDismiss={dismiss} />
      ))}
    </div>
  )
}
