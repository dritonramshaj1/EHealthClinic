import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' }
    catch { return false }
  })

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('dark-mode') === 'true' }
    catch { return false }
  })

  const [activeBranchId, setActiveBranchId] = useState(() => {
    try { return localStorage.getItem('active-branch-id') || null }
    catch { return null }
  })

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    try { localStorage.setItem('dark-mode', darkMode) } catch {}
  }, [darkMode])

  // Persist sidebar state
  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', sidebarCollapsed) } catch {}
  }, [sidebarCollapsed])

  // Persist active branch
  useEffect(() => {
    try {
      if (activeBranchId) localStorage.setItem('active-branch-id', activeBranchId)
      else localStorage.removeItem('active-branch-id')
    } catch {}
  }, [activeBranchId])

  const toggleSidebar = useCallback(() => setSidebarCollapsed(v => !v), [])
  const toggleDarkMode = useCallback(() => setDarkMode(v => !v), [])

  return (
    <UIContext.Provider value={{
      sidebarCollapsed,
      darkMode,
      activeBranchId,
      toggleSidebar,
      toggleDarkMode,
      setActiveBranch: setActiveBranchId,
    }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
