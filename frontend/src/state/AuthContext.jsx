import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios.js'

const AuthContext = createContext(null)

function loadAuth() {
  try {
    const raw = localStorage.getItem('auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveAuth(value) {
  if (!value) localStorage.removeItem('auth')
  else localStorage.setItem('auth', JSON.stringify(value))
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth())

  useEffect(() => { saveAuth(auth) }, [auth])

  // attach token to every request
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const token = auth?.accessToken
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    const resId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config
        const status = error?.response?.status

        // try refresh once
        if (status === 401 && !original.__isRetry && auth?.refreshToken) {
          original.__isRetry = true
          try {
            const r = await api.post('/auth/refresh', { refreshToken: auth.refreshToken })
            setAuth({
              accessToken: r.data.accessToken,
              accessTokenExpiresAtUtc: r.data.accessTokenExpiresAtUtc,
              refreshToken: r.data.refreshToken,
              refreshTokenExpiresAtUtc: r.data.refreshTokenExpiresAtUtc,
              user: { id: r.data.userId, email: r.data.email, fullName: r.data.fullName, roles: r.data.roles }
            })
            original.headers.Authorization = `Bearer ${r.data.accessToken}`
            return api(original)
          } catch (e) {
            setAuth(null)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.request.eject(reqId)
      api.interceptors.response.eject(resId)
    }
  }, [auth?.accessToken, auth?.refreshToken])

  const value = useMemo(() => ({
    auth,
    isLoggedIn: !!auth?.accessToken,
    roles: auth?.user?.roles || [],
    user: auth?.user || null,
    async login(email, password) {
      const r = await api.post('/auth/login', { email, password })
      setAuth({
        accessToken: r.data.accessToken,
        accessTokenExpiresAtUtc: r.data.accessTokenExpiresAtUtc,
        refreshToken: r.data.refreshToken,
        refreshTokenExpiresAtUtc: r.data.refreshTokenExpiresAtUtc,
        user: { id: r.data.userId, email: r.data.email, fullName: r.data.fullName, roles: r.data.roles }
      })
    },
    async register(fullName, email, password, role) {
      const r = await api.post('/auth/register', { fullName, email, password, role })
      setAuth({
        accessToken: r.data.accessToken,
        accessTokenExpiresAtUtc: r.data.accessTokenExpiresAtUtc,
        refreshToken: r.data.refreshToken,
        refreshTokenExpiresAtUtc: r.data.refreshTokenExpiresAtUtc,
        user: { id: r.data.userId, email: r.data.email, fullName: r.data.fullName, roles: r.data.roles }
      })
    },
    logout() {
      setAuth(null)
    }
  }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
