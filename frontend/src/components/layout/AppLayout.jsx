import { Outlet } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { useSignalRNotifications } from '../../state/useSignalRNotifications.js'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

export default function AppLayout() {
  const { auth } = useAuth()
  const { sidebarCollapsed } = useUI()
  useSignalRNotifications(auth?.accessToken)

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
