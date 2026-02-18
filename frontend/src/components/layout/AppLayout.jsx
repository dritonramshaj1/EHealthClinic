import { Outlet } from 'react-router-dom'
import { useUI } from '../../state/UIContext.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

export default function AppLayout() {
  const { sidebarCollapsed } = useUI()

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
