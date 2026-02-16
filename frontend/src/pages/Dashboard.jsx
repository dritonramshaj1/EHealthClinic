import React from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import DoctorDashboard from './DoctorDashboard.jsx'
import PatientDashboard from './PatientDashboard.jsx'

export default function Dashboard() {
  const { roles } = useAuth()

  if (roles?.includes('Admin')) return <AdminDashboard />
  if (roles?.includes('Doctor')) return <DoctorDashboard />
  return <PatientDashboard />
}
