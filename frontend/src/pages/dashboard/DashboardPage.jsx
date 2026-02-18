import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import { analyticsApi } from '../../api/services/analyticsApi.js'
import { queueApi } from '../../api/services/queueApi.js'
import { branchesApi } from '../../api/services/branchesApi.js'
import { messagesApi } from '../../api/services/messagesApi.js'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { StatusPieChart, MonthlyTrendChart, PerDoctorBarChart, SpecialtiesBarChart } from '../../components/dashboard/DashboardCharts.jsx'
import MiniCalendar from '../../components/dashboard/MiniCalendar.jsx'
import UpcomingAppointments from '../../components/dashboard/UpcomingAppointments.jsx'
import DashboardNotes from '../../components/dashboard/DashboardNotes.jsx'

const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
const todayEnd = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}
const nextDaysStart = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function QuickLink({ to, icon, label, subtitle, variant = 'primary' }) {
  return (
    <Link to={to} className="dashboard-quick-link" style={{ textDecoration: 'none' }}>
      <div className={`dashboard-quick-link-icon ${variant}`}>{icon}</div>
      <div className="dashboard-quick-link-text">
        <span className="dashboard-quick-link-label">{label}</span>
        {subtitle && <span className="dashboard-quick-link-sub">{subtitle}</span>}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, primaryRole, hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [queueStats, setQueueStats] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [firstBranchId, setFirstBranchId] = useState(null)

  const appointmentsByDate = useMemo(() => {
    const byDate = {}
    for (const a of upcomingAppointments) {
      if (!a.startsAtUtc) continue
      const d = new Date(a.startsAtUtc)
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      byDate[key] = (byDate[key] || 0) + 1
    }
    return byDate
  }, [upcomingAppointments])

  useEffect(() => {
    const fetches = []
    if (hasPermission('reports.read') || primaryRole === 'Admin' || primaryRole === 'Doctor') {
      fetches.push(analyticsApi.get().then(r => setAnalytics(r.data)).catch(() => {}))
    }
    if (hasPermission('queue.read')) {
      fetches.push(
        branchesApi.list().then(r => {
          const list = r.data || []
          if (list.length) setFirstBranchId(list[0].id)
          return list
        }).catch(() => [])
      )
    }
    if (hasPermission('messages.read')) {
      fetches.push(messagesApi.getUnreadCount().then(r => setUnreadMessages(r.data?.count ?? 0)).catch(() => {}))
    }
    if (primaryRole === 'Doctor' || primaryRole === 'Patient' || primaryRole === 'Receptionist' || primaryRole === 'Admin') {
      fetches.push(
        appointmentsApi.list({ fromUtc: todayStart(), toUtc: todayEnd() })
          .then(r => setTodayAppointments((r.data || []).length))
          .catch(() => {})
      )
      fetches.push(
        appointmentsApi.list({ fromUtc: new Date().toISOString(), toUtc: nextDaysStart(14) })
          .then(r => {
            const list = (r.data || []).filter(a => new Date(a.startsAtUtc) >= new Date()).sort((a, b) => new Date(a.startsAtUtc) - new Date(b.startsAtUtc))
            setUpcomingAppointments(list)
          })
          .catch(() => {})
      )
    }
    Promise.all(fetches).finally(() => setLoading(false))
  }, [primaryRole, hasPermission])

  useEffect(() => {
    if (!firstBranchId || !hasPermission('queue.read')) return
    queueApi.getStats(firstBranchId).then(r => setQueueStats(r.data)).catch(() => {})
  }, [firstBranchId, hasPermission])

  const welcomeName = user?.fullName || 'User'

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={primaryRole === 'Admin' ? 'Menaxhimi i klinikës' : primaryRole === 'Doctor' ? 'Takimet dhe puna juaj' : primaryRole === 'Patient' ? 'Shëndeti juaj' : `Mirë se vini, ${welcomeName}`}
      />

      <div className="content-block dashboard-page">
        {loading && (
          <p className="text-secondary mb-4">Duke ngarkuar...</p>
        )}

        {/* ─── Admin ───────────────────────────────────────────────── */}
        {primaryRole === 'Admin' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Përmbledhje e shpejtë</h3>
              <div className="d-grid grid-auto-fit-280 gap-4 mb-4">
                {analytics?.summary && (
                  <>
                    <Link to="/appointments" style={{ textDecoration: 'none' }}>
                      <StatCard title="Takime (gjithsej)" value={analytics.summary.total} icon="📅" variant="primary" />
                    </Link>
                    <Link to="/appointments?status=Scheduled" style={{ textDecoration: 'none' }}>
                      <StatCard title="Të planifikuara" value={analytics.summary.scheduled} icon="⏳" variant="teal" />
                    </Link>
                    <Link to="/appointments?status=Completed" style={{ textDecoration: 'none' }}>
                      <StatCard title="Të përfunduara" value={analytics.summary.completed} icon="✅" variant="success" />
                    </Link>
                    <StatCard title="Të anuluara" value={analytics.summary.cancelled} icon="🚫" variant="danger" />
                  </>
                )}
                {queueStats != null && hasPermission('queue.read') && (
                  <Link to="/queue" style={{ textDecoration: 'none' }}>
                    <StatCard title="Radha sot (në pritje)" value={queueStats.waiting ?? 0} icon="🔢" variant="warning" />
                  </Link>
                )}
                {hasPermission('messages.read') && (
                  <Link to="/messages" style={{ textDecoration: 'none' }}>
                    <StatCard title="Mesazhe të palexuara" value={unreadMessages} icon="✉️" variant="teal" />
                  </Link>
                )}
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Shkurtesat</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label="Takime" subtitle="Të gjitha takimet" variant="primary" />
                <QuickLink to="/queue" icon="🔢" label="Radha" subtitle="Menaxho radhën" variant="teal" />
                <QuickLink to="/patients" icon="👥" label="Pacientët" subtitle="Regjistri" variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label="Faturat" subtitle="Billing" variant="warning" />
                <QuickLink to="/settings/users" icon="⚙️" label="Përdorues & role" subtitle="Konfigurim" variant="primary" />
                <QuickLink to="/branches" icon="🏢" label="Degët" subtitle="Branches" variant="teal" />
                <QuickLink to="/reports" icon="📊" label="Raportet" subtitle="Analitikë" variant="success" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="warning" />
              </div>
            </section>
            {analytics && (
              <section className="dashboard-section">
                <h3 className="dashboard-section-title">Statistika & grafikë</h3>
                <div className="dashboard-charts-grid">
                  <Card><CardBody><h4 className="chart-card-title">Takime sipas statusit</h4><StatusPieChart data={analytics.statusDistribution} /></CardBody></Card>
                  <Card><CardBody><h4 className="chart-card-title">Trendi mujor (12 muaj)</h4><MonthlyTrendChart data={analytics.monthlyData} /></CardBody></Card>
                  {analytics.perDoctor?.length > 0 && (
                    <Card className="chart-span-2"><CardBody><h4 className="chart-card-title">Takime sipas doktorit</h4><PerDoctorBarChart data={analytics.perDoctor} /></CardBody></Card>
                  )}
                  <Card><CardBody><h4 className="chart-card-title">Specialitetet më të kërkuara</h4><SpecialtiesBarChart data={analytics.topSpecialties} /></CardBody></Card>
                </div>
              </section>
            )}
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Kalendar</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Takime të ardhshme</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Përdorni Raportet për të parë takimet sipas doktorëve dhe muajve. Radha dhe takimet mund të menaxhohen nga menyja.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Doctor ──────────────────────────────────────────────── */}
        {primaryRole === 'Doctor' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Sot</h3>
              <div className="d-grid grid-auto-fit-280 gap-4 mb-4">
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title="Takimet e mia sot" value={todayAppointments ?? '—'} icon="📅" variant="primary" />
                </Link>
                {analytics?.summary && (
                  <Link to="/appointments?status=Scheduled" style={{ textDecoration: 'none' }}>
                    <StatCard title="Të planifikuara" value={analytics.summary.scheduled} icon="⏳" variant="teal" />
                  </Link>
                )}
                <Link to="/messages" style={{ textDecoration: 'none' }}>
                  <StatCard title="Mesazhe të palexuara" value={unreadMessages} icon="✉️" variant="warning" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Shkurtesat</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label="Takimet e mia" subtitle="Kalendari" variant="primary" />
                <QuickLink to="/clinical/prescriptions" icon="💊" label="Recetat" subtitle="Prescriptions" variant="teal" />
                <QuickLink to="/laboratory" icon="🧪" label="Porositë lab" subtitle="Rezultatet" variant="success" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="warning" />
                <QuickLink to="/hr/leave" icon="🏖️" label="Leje" subtitle="Kërko leje" variant="primary" />
              </div>
            </section>
            {analytics && (analytics.statusDistribution?.length > 0 || analytics.monthlyData?.length > 0) && (
              <section className="dashboard-section">
                <h3 className="dashboard-section-title">Statistika</h3>
                <div className="dashboard-charts-grid dashboard-charts-grid-sm">
                  <Card><CardBody><h4 className="chart-card-title">Takime sipas statusit</h4><StatusPieChart data={analytics.statusDistribution} /></CardBody></Card>
                  <Card><CardBody><h4 className="chart-card-title">Trendi mujor</h4><MonthlyTrendChart data={analytics.monthlyData} /></CardBody></Card>
                  {analytics.topSpecialties?.length > 0 && (
                    <Card><CardBody><h4 className="chart-card-title">Specialiteti</h4><SpecialtiesBarChart data={analytics.topSpecialties} /></CardBody></Card>
                  )}
                </div>
              </section>
            )}
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Kalendar</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Takime të ardhshme</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Kontrolloni takimet e sotme dhe mesazhet e reja që të mos mungojë asgjë.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Patient ─────────────────────────────────────────────── */}
        {primaryRole === 'Patient' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Sot</h3>
              <div className="d-grid grid-auto-fit-280 gap-4 mb-4">
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title="Takimet e mia sot" value={todayAppointments ?? '—'} icon="📅" variant="primary" />
                </Link>
                <Link to="/messages" style={{ textDecoration: 'none' }}>
                  <StatCard title="Mesazhe të palexuara" value={unreadMessages} icon="✉️" variant="teal" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Shëndeti im</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label="Takimet" subtitle="Rezervo ose shiko" variant="primary" />
                <QuickLink to="/clinical/prescriptions" icon="💊" label="Recetat" subtitle="Të miat" variant="teal" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Dërgo mesazh'} variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label="Faturat" subtitle="Billing" variant="warning" />
              </div>
            </section>
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Kalendar</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Takime të ardhshme</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Përdorni Mesazhet për të komunikuar me mjekun tuaj. Faturat mund të shihen te Billing.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Receptionist ────────────────────────────────────────── */}
        {primaryRole === 'Receptionist' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Radha dhe takimet</h3>
              <div className="d-grid grid-auto-fit-280 gap-4 mb-4">
                {queueStats != null && (
                  <>
                    <Link to="/queue" style={{ textDecoration: 'none' }}>
                      <StatCard title="Në pritje" value={queueStats.waiting ?? 0} icon="⏳" variant="primary" />
                    </Link>
                    <StatCard title="Në progres" value={queueStats.inProgress ?? 0} icon="🔄" variant="teal" />
                    <StatCard title="Përfunduar sot" value={queueStats.done ?? 0} icon="✅" variant="success" />
                  </>
                )}
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title="Takime sot" value={todayAppointments ?? '—'} icon="📅" variant="warning" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Shkurtesat</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/queue" icon="🔢" label="Radha" subtitle="Menaxho radhën" variant="primary" />
                <QuickLink to="/appointments" icon="📅" label="Takime" subtitle="Rezervime" variant="teal" />
                <QuickLink to="/patients" icon="👥" label="Pacientët" subtitle="Regjistri" variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label="Faturat" subtitle="Billing" variant="warning" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="primary" />
              </div>
            </section>
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Kalendar</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Takime të ardhshme</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Mbajeni radhën e përditësuar dhe shtoni pacientë në radhë kur mbërrijnë.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Lab Technician ──────────────────────────────────────── */}
        {primaryRole === 'LabTechnician' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Laboratori</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/laboratory" icon="🧪" label="Porositë lab" subtitle="Porositë dhe rezultatet" variant="primary" />
                <QuickLink to="/documents" icon="📄" label="Dokumentet" subtitle="Skanime" variant="teal" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="success" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Regjistroni rezultatet e testeve te Laboratori për t’i bërë të dukshme për mjekun.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Pharmacist ───────────────────────────────────────────── */}
        {primaryRole === 'Pharmacist' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">Farmaci & inventar</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/clinical/prescriptions" icon="💊" label="Recetat" subtitle="Të arkëtueshme" variant="primary" />
                <QuickLink to="/inventory" icon="📦" label="Inventari" subtitle="Stoku" variant="teal" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="success" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Kontrolloni inventarin dhe plotësoni recetat nga lista e recetave.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── HR Manager ────────────────────────────────────────────── */}
        {primaryRole === 'HRManager' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">HR & raporte</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/hr/shifts" icon="🕐" label="Turnet" subtitle="Orari" variant="primary" />
                <QuickLink to="/hr/leave" icon="🏖️" label="Kërkesat e lejes" subtitle="Aprovo / refuzo" variant="teal" />
                <QuickLink to="/settings/users" icon="👥" label="Përdoruesit" subtitle="Lista" variant="success" />
                <QuickLink to="/reports" icon="📊" label="Raportet" subtitle="Analitikë" variant="warning" />
                <QuickLink to="/messages" icon="✉️" label="Mesazhe" subtitle={unreadMessages ? `${unreadMessages} të palexuara` : 'Inbox'} variant="primary" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">Shënime</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>Këshillë:</strong> Menaxhoni turnet dhe kërkesat e lejes nga seksioni HR.
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Fallback (role tjetër) ───────────────────────────────── */}
        {!['Admin', 'Doctor', 'Patient', 'Receptionist', 'LabTechnician', 'Pharmacist', 'HRManager'].includes(primaryRole) && (
          <Card>
            <CardBody>
              <h4 className="mb-2">Dashboard</h4>
              <p className="text-secondary mb-0">Përdorni menyën anësore për të hyrë në modulet e disponueshme për rolin tuaj.</p>
            </CardBody>
          </Card>
        )}
      </div>

      <style>{`
        .dashboard-page { max-width: 1200px; }
        .dashboard-section { margin-bottom: var(--space-8, 2rem); }
        .dashboard-section-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }
        .dashboard-quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
        }
        .dashboard-quick-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .dashboard-quick-link:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }
        .dashboard-quick-link-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .dashboard-quick-link-icon.primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .dashboard-quick-link-icon.teal { background: var(--color-teal-subtle); color: var(--color-teal); }
        .dashboard-quick-link-icon.success { background: var(--color-success-subtle); color: var(--color-success); }
        .dashboard-quick-link-icon.warning { background: var(--color-warning-subtle); color: var(--color-warning); }
        .dashboard-quick-link-text { display: flex; flex-direction: column; gap: 2px; }
        .dashboard-quick-link-label { font-weight: 600; color: var(--text-primary); }
        .dashboard-quick-link-sub { font-size: var(--font-size-xs); color: var(--text-secondary); }
        .dashboard-tip { background: var(--color-primary-subtle); border-color: var(--color-primary); }
        .dashboard-charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
        .dashboard-charts-grid .chart-card-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary); }
        .dashboard-charts-grid .chart-span-2 { grid-column: span 2; }
        .dashboard-charts-grid-sm { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
        .dashboard-widgets-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); }
        .dashboard-widgets-row .widget-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-3); color: var(--text-primary); }
        @media (max-width: 768px) { .dashboard-charts-grid { grid-template-columns: 1fr; } .dashboard-charts-grid .chart-span-2 { grid-column: span 1; } }
      `}</style>
    </>
  )
}
