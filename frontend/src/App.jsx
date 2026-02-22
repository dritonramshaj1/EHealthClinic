import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PermissionRoute from './components/PermissionRoute.jsx'
import Spinner from './components/ui/Spinner.jsx'

// Public pages
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const Forbidden = lazy(() => import('./pages/Forbidden.jsx'))

// Dashboard
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'))

// Placeholder for modules not yet built
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage.jsx'))

// Sprint 5: Core pages
const PatientsPage = lazy(() => import('./pages/patients/PatientsPage.jsx'))
const PatientDetailPage = lazy(() => import('./pages/patients/PatientDetailPage.jsx'))
const AppointmentsPage = lazy(() => import('./pages/appointments/AppointmentsPage.jsx'))
const AppointmentDetailPage = lazy(() => import('./pages/appointments/AppointmentDetailPage.jsx'))
const QueuePage = lazy(() => import('./pages/queue/QueuePage.jsx'))
const PrescriptionsPage = lazy(() => import('./pages/clinical/PrescriptionsPage.jsx'))
const PrescriptionDetailPage = lazy(() => import('./pages/clinical/PrescriptionDetailPage.jsx'))
const LabOrdersPage = lazy(() => import('./pages/laboratory/LabOrdersPage.jsx'))
const LabOrderDetailPage = lazy(() => import('./pages/laboratory/LabOrderDetailPage.jsx'))
const InvoicesPage = lazy(() => import('./pages/billing/InvoicesPage.jsx'))
const InvoiceDetailPage = lazy(() => import('./pages/billing/InvoiceDetailPage.jsx'))
const InsurancePage = lazy(() => import('./pages/billing/InsurancePage.jsx'))
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage.jsx'))
const InventoryDetailPage = lazy(() => import('./pages/inventory/InventoryDetailPage.jsx'))
const ShiftsPage = lazy(() => import('./pages/hr/ShiftsPage.jsx'))
const LeaveRequestsPage = lazy(() => import('./pages/hr/LeaveRequestsPage.jsx'))
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage.jsx'))
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage.jsx'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage.jsx'))
const AuditPage = lazy(() => import('./pages/audit/AuditPage.jsx'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage.jsx'))
const BranchesPage = lazy(() => import('./pages/settings/BranchesPage.jsx'))
const UsersPage = lazy(() => import('./pages/settings/UsersPage.jsx'))
const RolesPage = lazy(() => import('./pages/settings/RolesPage.jsx'))

// Existing pages
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<Spinner center />}><LandingPage /></Suspense>} />
      <Route path="/login" element={<Suspense fallback={<Spinner center />}><LoginPage /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<Spinner center />}><RegisterPage /></Suspense>} />
      <Route path="/forbidden" element={<Suspense fallback={<Spinner center />}><Forbidden /></Suspense>} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Suspense fallback={<Spinner center />}><DashboardPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<Spinner center />}><ProfilePage /></Suspense>} />

        <Route path="patients" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="patients.read"><PatientsPage /></PermissionRoute></Suspense>} />
        <Route path="patients/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="patients.read"><PatientDetailPage /></PermissionRoute></Suspense>} />
        <Route path="appointments" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="appointments.read"><AppointmentsPage /></PermissionRoute></Suspense>} />
        <Route path="appointments/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="appointments.read"><AppointmentDetailPage /></PermissionRoute></Suspense>} />
        <Route path="queue" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="queue.read"><QueuePage /></PermissionRoute></Suspense>} />
        <Route path="clinical/prescriptions" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="prescriptions.read"><PrescriptionsPage /></PermissionRoute></Suspense>} />
        <Route path="clinical/prescriptions/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="prescriptions.read"><PrescriptionDetailPage /></PermissionRoute></Suspense>} />
        <Route path="laboratory" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="lab.read"><LabOrdersPage /></PermissionRoute></Suspense>} />
        <Route path="laboratory/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="lab.read"><LabOrderDetailPage /></PermissionRoute></Suspense>} />
        <Route path="documents" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="documents.read"><DocumentsPage /></PermissionRoute></Suspense>} />

        <Route path="billing/invoices" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="billing.read"><InvoicesPage /></PermissionRoute></Suspense>} />
        <Route path="billing/invoices/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="billing.read"><InvoiceDetailPage /></PermissionRoute></Suspense>} />
        <Route path="billing/insurance" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="insurance.read"><InsurancePage /></PermissionRoute></Suspense>} />

        <Route path="inventory" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="inventory.read"><InventoryPage /></PermissionRoute></Suspense>} />
        <Route path="inventory/:id" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="inventory.read"><InventoryDetailPage /></PermissionRoute></Suspense>} />
        <Route path="hr/shifts" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="hr.read"><ShiftsPage /></PermissionRoute></Suspense>} />
        <Route path="hr/leave" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="hr.read"><LeaveRequestsPage /></PermissionRoute></Suspense>} />

        <Route path="messages" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="messages.read"><MessagesPage /></PermissionRoute></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="notifications.read"><NotificationsPage /></PermissionRoute></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="reports.read"><ReportsPage /></PermissionRoute></Suspense>} />
        <Route path="audit" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="audit.read"><AuditPage /></PermissionRoute></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="settings.read"><SettingsPage /></PermissionRoute></Suspense>} />
        <Route path="settings/branches" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="branches.read"><BranchesPage /></PermissionRoute></Suspense>} />
        <Route path="settings/users" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="users.read"><UsersPage /></PermissionRoute></Suspense>} />
        <Route path="settings/roles" element={<Suspense fallback={<Spinner center />}><PermissionRoute permission="users.read"><RolesPage /></PermissionRoute></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
