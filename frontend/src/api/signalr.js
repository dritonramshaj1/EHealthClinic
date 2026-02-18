import * as signalR from '@microsoft/signalr'
import { API_BASE_URL } from './axios.js'

const HUB_PATH = '/hubs/notifications'

/**
 * Create and start a SignalR connection to the notifications hub.
 * Token is passed as query string for WebSocket auth.
 * @param {string} accessToken - JWT access token
 * @param {(payload: { id: string, type: string, message: string, createdAtUtc: string }) => void} onNotification - called when server sends ReceiveNotification
 * @returns {Promise<signalR.HubConnection>} the started connection (call .stop() to disconnect)
 */
export async function connectNotificationsHub(accessToken, onNotification) {
  const url = API_BASE_URL.replace(/\/$/, '') + HUB_PATH
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, { accessTokenFactory: () => accessToken })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build()

  connection.on('ReceiveNotification', (payload) => {
    onNotification(payload)
  })

  await connection.start()
  return connection
}
