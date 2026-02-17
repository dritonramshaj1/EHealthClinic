import React, { useState } from 'react'

export default function UserFormModal({ mode, initialData, specialties, onSubmit, onClose }) {
  const isEdit = mode === 'edit'
  const existingRole = initialData?.roles?.[0] || 'Patient'

  const [fullName, setFullName] = useState(initialData?.fullName || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(existingRole)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Doctor fields
  const [specialty, setSpecialty] = useState(initialData?.roleProfile?.specialty || '')
  const [licenseNumber, setLicenseNumber] = useState(initialData?.roleProfile?.licenseNumber || '')
  const [bio, setBio] = useState(initialData?.roleProfile?.bio || '')
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData?.roleProfile?.yearsOfExperience || 0)
  const [education, setEducation] = useState(initialData?.roleProfile?.education || '')
  const [certifications, setCertifications] = useState(initialData?.roleProfile?.certifications || '')
  const [languages, setLanguages] = useState(initialData?.roleProfile?.languages || '')
  const [consultationFee, setConsultationFee] = useState(initialData?.roleProfile?.consultationFee || '')

  // Patient fields
  const [bloodType, setBloodType] = useState(initialData?.roleProfile?.bloodType || '')
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.roleProfile?.dateOfBirth || '')
  const [allergies, setAllergies] = useState(initialData?.roleProfile?.allergies || '')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = { fullName, email }
      if (!isEdit) { data.password = password; data.role = role }
      const activeRole = isEdit ? existingRole : role
      if (activeRole === 'Doctor') {
        Object.assign(data, {
          specialty, licenseNumber, bio,
          yearsOfExperience: parseInt(yearsOfExperience) || 0,
          education, certifications, languages,
          consultationFee: consultationFee ? parseFloat(consultationFee) : null
        })
      }
      if (activeRole === 'Patient') {
        Object.assign(data, { bloodType, dateOfBirth: dateOfBirth || null, allergies })
      }
      await onSubmit(data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const activeRole = isEdit ? existingRole : role

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24
    }}>
      <div style={{
        background: 'var(--white, #fff)', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div className="flex-between mb-4">
          <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
            {isEdit ? 'Edit User' : 'Create New User'}
          </h3>
          <button className="btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {!isEdit && (
            <>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Patient">Patient</option>
                </select>
              </div>
            </>
          )}

          {activeRole === 'Doctor' && (
            <>
              <div className="form-group">
                <label>Specialty</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
                  <option value="">Select specialty...</option>
                  {(specialties || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea rows="2" value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" min="0" max="60" value={yearsOfExperience}
                  onChange={e => setYearsOfExperience(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Education</label>
                <input value={education} onChange={e => setEducation(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Certifications (comma separated)</label>
                <input value={certifications} onChange={e => setCertifications(e.target.value)}
                  placeholder="ACLS, BLS, ATLS" />
              </div>
              <div className="form-group">
                <label>Languages (comma separated)</label>
                <input value={languages} onChange={e => setLanguages(e.target.value)}
                  placeholder="English, Albanian" />
              </div>
              <div className="form-group">
                <label>Consultation Fee (EUR)</label>
                <input type="number" step="0.01" min="0" value={consultationFee}
                  onChange={e => setConsultationFee(e.target.value)} />
              </div>
            </>
          )}

          {activeRole === 'Patient' && (
            <>
              <div className="form-group">
                <label>Blood Type</label>
                <select value={bloodType} onChange={e => setBloodType(e.target.value)}>
                  <option value="">Select...</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt =>
                    <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Allergies</label>
                <textarea rows="2" value={allergies} onChange={e => setAllergies(e.target.value)} />
              </div>
            </>
          )}

          <button type="submit" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User')}
          </button>
        </form>
      </div>
    </div>
  )
}
