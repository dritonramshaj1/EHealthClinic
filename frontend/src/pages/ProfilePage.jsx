import React, { useEffect, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import Spinner from '../components/Spinner.jsx'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  // Doctor fields
  const [specialty, setSpecialty] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [bio, setBio] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState(0)
  const [education, setEducation] = useState('')
  const [certifications, setCertifications] = useState('')
  const [languages, setLanguages] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [specialties, setSpecialties] = useState([])

  // Patient fields
  const [bloodType, setBloodType] = useState('')
  const [allergies, setAllergies] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  async function loadProfile() {
    try {
      const [res, specsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/specialties'),
      ])
      const p = res.data
      setProfile(p)
      setSpecialties(specsRes.data)
      setFullName(p.fullName || '')
      setEmail(p.email || '')
      if (p.roleProfile) {
        setSpecialty(p.roleProfile.specialty || '')
        setLicenseNumber(p.roleProfile.licenseNumber || '')
        setBio(p.roleProfile.bio || '')
        setYearsOfExperience(p.roleProfile.yearsOfExperience || 0)
        setEducation(p.roleProfile.education || '')
        setCertifications(p.roleProfile.certifications || '')
        setLanguages(p.roleProfile.languages || '')
        setConsultationFee(p.roleProfile.consultationFee || '')
        setBloodType(p.roleProfile.bloodType || '')
        setAllergies(p.roleProfile.allergies || '')
        setDateOfBirth(p.roleProfile.dateOfBirth || '')
      }
    } catch (e) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) loadProfile() }, [user])

  const isDoctor = profile?.roles?.includes('Doctor')
  const isPatient = profile?.roles?.includes('Patient')

  async function saveProfile(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const body = { fullName, email }
      if (isDoctor) body.doctorProfile = {
        specialty, licenseNumber, bio,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        education, certifications, languages,
        consultationFee: consultationFee ? parseFloat(consultationFee) : null
      }
      if (isPatient) body.patientProfile = { bloodType, allergies, dateOfBirth: dateOfBirth || null }
      await api.put('/profile', body)
      setSuccess('Profile updated successfully!')
      await loadProfile()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setChangingPw(true)
    try {
      await api.post('/profile/change-password', { currentPassword, newPassword })
      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  if (loading) return <Layout><Spinner /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Profile Settings</h2>
          <p>Manage your account — {profile?.fullName}</p>
        </div>
        <a href="/dashboard" className="secondary" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>
          Back to Dashboard
        </a>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Account info */}
      <div className="row-3 mb-4">
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 16 }}>{profile?.fullName}</div>
          <div className="stat-label">{profile?.email}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 14 }}>{(profile?.roles || []).join(', ')}</div>
          <div className="stat-label">Role</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 14 }}>{new Date(profile?.createdAtUtc).toLocaleDateString()}</div>
          <div className="stat-label">Member Since</div>
        </div>
      </div>

      <div className="row">
        {/* Edit Profile */}
        <div className="card">
          <div className="card-title">Edit Profile</div>
          <form className="form-stack" onSubmit={saveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {isDoctor && (
              <>
                <div className="form-group">
                  <label>Specialty</label>
                  <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
                    <option value="">Select specialty...</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. LIC-12345" />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows="3" value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Brief description about yourself..." />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input type="number" min="0" max="60" value={yearsOfExperience}
                    onChange={e => setYearsOfExperience(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Education</label>
                  <input value={education} onChange={e => setEducation(e.target.value)}
                    placeholder="e.g. MD, University of Prishtina" />
                </div>
                <div className="form-group">
                  <label>Certifications (comma separated)</label>
                  <input value={certifications} onChange={e => setCertifications(e.target.value)}
                    placeholder="ACLS, BLS, ATLS" />
                </div>
                <div className="form-group">
                  <label>Languages (comma separated)</label>
                  <input value={languages} onChange={e => setLanguages(e.target.value)}
                    placeholder="English, Albanian, German" />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (EUR)</label>
                  <input type="number" step="0.01" min="0" value={consultationFee}
                    onChange={e => setConsultationFee(e.target.value)} placeholder="50.00" />
                </div>
              </>
            )}

            {isPatient && (
              <>
                <div className="form-group">
                  <label>Blood Type</label>
                  <select value={bloodType} onChange={e => setBloodType(e.target.value)}>
                    <option value="">Select...</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                    <option>O+</option><option>O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Allergies</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Penicillin, Pollen..."
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                  />
                </div>
              </>
            )}

            <button disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-title">Change Password</div>
          <form className="form-stack" onSubmit={changePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button disabled={changingPw} style={{ width: '100%' }}>
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
