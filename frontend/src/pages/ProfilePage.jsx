import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx'

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

  if (loading) return <Spinner center label="Loading profile..." />

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle={profile?.fullName || ''}
        actions={<Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>}
      />

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      <div className="content-block">
        <div className="row-3 mb-4">
          <Card>
            <CardBody>
              <div className="text-sm text-muted">Name</div>
              <div className="font-semibold">{profile?.fullName}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-muted">Email</div>
              <div className="font-semibold">{profile?.email}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-muted">Role</div>
              <div className="font-semibold">{(profile?.roles || []).join(', ')}</div>
            </CardBody>
          </Card>
        </div>

        <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card>
            <CardHeader title="Edit profile" />
            <CardBody>
              <form className="form-stack" onSubmit={saveProfile}>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                {isDoctor && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Specialty</label>
                      <select className="form-control" value={specialty} onChange={e => setSpecialty(e.target.value)}>
                        <option value="">Select...</option>
                        {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">License number</label>
                      <input className="form-control" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. LIC-12345" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea className="form-control" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Years of experience</label>
                      <input type="number" className="form-control" min={0} max={60} value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Education</label>
                      <input className="form-control" value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g. MD, University of Prishtina" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Certifications (comma separated)</label>
                      <input className="form-control" value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="ACLS, BLS" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Languages (comma separated)</label>
                      <input className="form-control" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Albanian" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Consultation fee (EUR)</label>
                      <input type="number" className="form-control" step="0.01" min={0} value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder="50.00" />
                    </div>
                  </>
                )}

                {isPatient && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Blood type</label>
                      <select className="form-control" value={bloodType} onChange={e => setBloodType(e.target.value)}>
                        <option value="">Select...</option>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of birth</label>
                      <input type="date" className="form-control" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Allergies</label>
                      <textarea className="form-control" rows={2} placeholder="e.g. Penicillin" value={allergies} onChange={e => setAllergies(e.target.value)} />
                    </div>
                  </>
                )}

                <Button type="submit" variant="primary" disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Change password" />
            <CardBody>
              <form className="form-stack" onSubmit={changePassword}>
                <div className="form-group">
                  <label className="form-label">Current password</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New password</label>
                  <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" variant="secondary" disabled={changingPw} style={{ width: '100%' }}>
                  {changingPw ? 'Changing...' : 'Change password'}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
