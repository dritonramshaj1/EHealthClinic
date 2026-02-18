// Mirror of backend Authorization/PermissionMatrix.cs
// Keep in sync with backend whenever permissions change.

export const PermissionMatrix = {
  Admin: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'queue.read', 'queue.write',
    'medical-records.read', 'medical-records.write',
    'prescriptions.read', 'prescriptions.write',
    'lab.read', 'lab.write',
    'billing.read', 'billing.write',
    'insurance.read', 'insurance.write',
    'inventory.read', 'inventory.write',
    'hr.read', 'hr.write',
    'documents.read', 'documents.write',
    'messages.read', 'messages.write',
    'reports.read',
    'users.read', 'users.write',
    'branches.read', 'branches.write',
    'audit.read',
    'settings.read', 'settings.write',
    'notifications.read', 'notifications.write',
  ],
  Doctor: [
    'patients.read',
    'appointments.read', 'appointments.write',
    'medical-records.read', 'medical-records.write',
    'prescriptions.read', 'prescriptions.write',
    'lab.read', 'lab.write',
    'documents.read', 'documents.write',
    'messages.read', 'messages.write',
    'reports.read',
    'hr.read', // so Doctor can see Leave Requests and submit own leave
    'notifications.read', 'notifications.write',
  ],
  Patient: [
    'appointments.read',
    'medical-records.read',
    'prescriptions.read',
    'lab.read',
    'billing.read',
    'insurance.read',
    'messages.read', 'messages.write',
    'notifications.read',
  ],
  Receptionist: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'queue.read', 'queue.write',
    'billing.read', 'billing.write',
    'insurance.read',
    'documents.read', 'documents.write',
    'messages.read',
    'notifications.read',
  ],
  LabTechnician: [
    'patients.read',
    'lab.read', 'lab.write',
    'documents.read',
    'notifications.read',
  ],
  Pharmacist: [
    'prescriptions.read', 'prescriptions.write',
    'inventory.read', 'inventory.write',
    'notifications.read',
  ],
  HRManager: [
    'hr.read', 'hr.write',
    'users.read',
    'reports.read',
    'notifications.read',
  ],
}

// Role priority for display (highest = index 0)
export const RolePriority = [
  'Admin', 'Doctor', 'Receptionist',
  'HRManager', 'LabTechnician', 'Pharmacist', 'Patient',
]

export function getPrimaryRole(roles = []) {
  if (!roles || roles.length === 0) return 'Patient'
  for (const role of RolePriority) {
    if (roles.includes(role)) return role
  }
  return roles[0]
}

export function getPermissions(roles = []) {
  const perms = new Set()
  for (const role of roles) {
    const matrix = PermissionMatrix[role] || []
    matrix.forEach(p => perms.add(p))
  }
  return perms
}
