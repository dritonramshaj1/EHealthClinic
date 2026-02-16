import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'

export const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ✅ Always attach token from localStorage (prevents refresh race condition)
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth') // NOTE: you store it as "auth"
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed?.accessToken
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // ignore
  }
  return config
})