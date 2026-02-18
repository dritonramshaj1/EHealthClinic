import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { connectNotificationsHub } from '../api/signalr.js'

/**
 * Connects to the notifications SignalR hub when the user is logged in.
 * On new notification: shows a toast and dispatches 'ehealth:notification' so pages can refetch.
 */
export function useSignalRNotifications(accessToken) {
  const connectionRef = useRef(null)

  useEffect(() => {
    if (!accessToken) return

    let mounted = true
    connectNotificationsHub(accessToken, (payload) => {
      if (!mounted) return
      toast(payload.message || 'New notification', {
        icon: '🔔',
        duration: 5000,
      })
      window.dispatchEvent(new CustomEvent('ehealth:notification', { detail: payload }))
    })
      .then((connection) => {
        if (mounted) connectionRef.current = connection
      })
      .catch(() => {
        // Connection failed (e.g. hub not reachable); polling or manual refresh still work
      })

    return () => {
      mounted = false
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [accessToken])
}
