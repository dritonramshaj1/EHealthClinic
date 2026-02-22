import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'
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
  const { t } = useLang()
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
        title={t('dashboard.title')}
        subtitle={
          primaryRole === 'Admin'   ? t('dashboard.subtitleAdmin') :
          primaryRole === 'Doctor'  ? t('dashboard.subtitleDoctor') :
          primaryRole === 'Patient' ? t('dashboard.subtitlePatient') :
          welcomeName
        }
      />

      <div className="content-block dashboard-page">
        {loading && (
          <p className="text-secondary mb-4">{t('dashboard.loading')}</p>
        )}

        {/* ─── Admin ───────────────────────────────────────────────── */}
        {primaryRole === 'Admin' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.quickSummary')}</h3>
              <div className="stat-grid mb-3">
                {analytics?.summary && (
                  <>
                    <Link to="/appointments" style={{ textDecoration: 'none' }}>
                      <StatCard title={t('dashboard.totalAppointments')} value={analytics.summary.total} icon="📅" variant="primary" />
                    </Link>
                    <Link to="/appointments?status=Scheduled" style={{ textDecoration: 'none' }}>
                      <StatCard title={t('dashboard.scheduled')} value={analytics.summary.scheduled} icon="⏳" variant="teal" />
                    </Link>
                    <Link to="/appointments?status=Completed" style={{ textDecoration: 'none' }}>
                      <StatCard title={t('dashboard.completed')} value={analytics.summary.completed} icon="✅" variant="success" />
                    </Link>
                    <StatCard title={t('dashboard.cancelled')} value={analytics.summary.cancelled} icon="🚫" variant="danger" />
                  </>
                )}
                {queueStats != null && hasPermission('queue.read') && (
                  <Link to="/queue" style={{ textDecoration: 'none' }}>
                    <StatCard title={t('dashboard.queueToday')} value={queueStats.waiting ?? 0} icon="🔢" variant="warning" />
                  </Link>
                )}
                {hasPermission('messages.read') && (
                  <Link to="/messages" style={{ textDecoration: 'none' }}>
                    <StatCard title={t('dashboard.unreadMessages')} value={unreadMessages} icon="✉️" variant="teal" />
                  </Link>
                )}
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.shortcuts')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label={t('nav.appointments')} subtitle={t('dashboard.allAppointments')} variant="primary" />
                <QuickLink to="/queue" icon="🔢" label={t('nav.queue')} subtitle={t('dashboard.manageQueue')} variant="teal" />
                <QuickLink to="/patients" icon="👥" label={t('nav.patients')} subtitle={t('dashboard.patientRegistry')} variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label={t('nav.invoices')} subtitle={t('dashboard.billing')} variant="warning" />
                <QuickLink to="/settings/users" icon="⚙️" label={t('dashboard.usersAndRoles')} subtitle={t('dashboard.configure')} variant="primary" />
                <QuickLink to="/branches" icon="🏢" label={t('nav.branches')} subtitle={t('nav.branches')} variant="teal" />
                <QuickLink to="/reports" icon="📊" label={t('nav.reports')} subtitle={t('dashboard.analytics')} variant="success" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="warning" />
              </div>
            </section>
            {analytics && (
              <section className="dashboard-section">
                <h3 className="dashboard-section-title">{t('dashboard.statsAndCharts')}</h3>
                <div className="dashboard-charts-grid">
                  <Card><CardBody><h4 className="chart-card-title">{t('dashboard.appointmentsByStatus')}</h4><StatusPieChart data={analytics.statusDistribution} /></CardBody></Card>
                  <Card><CardBody><h4 className="chart-card-title">{t('dashboard.monthlyTrend')}</h4><MonthlyTrendChart data={analytics.monthlyData} /></CardBody></Card>
                  {analytics.perDoctor?.length > 0 && (
                    <Card><CardBody><h4 className="chart-card-title">{t('dashboard.appointmentsByDoctor')}</h4><PerDoctorBarChart data={analytics.perDoctor} /></CardBody></Card>
                  )}
                  <Card><CardBody><h4 className="chart-card-title">{t('dashboard.topSpecialties')}</h4><SpecialtiesBarChart data={analytics.topSpecialties} /></CardBody></Card>
                </div>
              </section>
            )}
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.calendar')}</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.upcomingAppointments')}</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipAdmin')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Doctor ──────────────────────────────────────────────── */}
        {primaryRole === 'Doctor' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.today')}</h3>
              <div className="stat-grid mb-3">
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title={t('dashboard.myAppointmentsToday')} value={todayAppointments ?? '—'} icon="📅" variant="primary" />
                </Link>
                {analytics?.summary && (
                  <Link to="/appointments?status=Scheduled" style={{ textDecoration: 'none' }}>
                    <StatCard title={t('dashboard.scheduled')} value={analytics.summary.scheduled} icon="⏳" variant="teal" />
                  </Link>
                )}
                <Link to="/messages" style={{ textDecoration: 'none' }}>
                  <StatCard title={t('dashboard.unreadMessages')} value={unreadMessages} icon="✉️" variant="warning" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.shortcuts')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label={t('nav.appointments')} subtitle={t('dashboard.myCalendar')} variant="primary" />
                <QuickLink to="/clinical/prescriptions" icon="💊" label={t('nav.prescriptions')} subtitle={t('dashboard.myPrescriptions')} variant="teal" />
                <QuickLink to="/laboratory" icon="🧪" label={t('dashboard.labOrders')} subtitle={t('nav.laboratory')} variant="success" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="warning" />
                <QuickLink to="/hr/leave" icon="🏖️" label={t('nav.leaveRequests')} subtitle={t('dashboard.requestLeave')} variant="primary" />
              </div>
            </section>
            {analytics && (analytics.statusDistribution?.length > 0 || analytics.monthlyData?.length > 0) && (
              <section className="dashboard-section">
                <h3 className="dashboard-section-title">{t('dashboard.statsAndCharts')}</h3>
                <div className="dashboard-charts-grid dashboard-charts-grid-sm">
                  <Card><CardBody><h4 className="chart-card-title">{t('dashboard.appointmentsByStatus')}</h4><StatusPieChart data={analytics.statusDistribution} /></CardBody></Card>
                  <Card><CardBody><h4 className="chart-card-title">{t('dashboard.monthlyTrend')}</h4><MonthlyTrendChart data={analytics.monthlyData} /></CardBody></Card>
                  {analytics.topSpecialties?.length > 0 && (
                    <Card><CardBody><h4 className="chart-card-title">{t('dashboard.topSpecialties')}</h4><SpecialtiesBarChart data={analytics.topSpecialties} /></CardBody></Card>
                  )}
                </div>
              </section>
            )}
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.calendar')}</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.upcomingAppointments')}</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipDoctor')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Patient ─────────────────────────────────────────────── */}
        {primaryRole === 'Patient' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.today')}</h3>
              <div className="stat-grid mb-3">
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title={t('dashboard.myAppointmentsToday')} value={todayAppointments ?? '—'} icon="📅" variant="primary" />
                </Link>
                <Link to="/messages" style={{ textDecoration: 'none' }}>
                  <StatCard title={t('dashboard.unreadMessages')} value={unreadMessages} icon="✉️" variant="teal" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.healthSection')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/appointments" icon="📅" label={t('nav.appointments')} subtitle={t('dashboard.bookOrView')} variant="primary" />
                <QuickLink to="/clinical/prescriptions" icon="💊" label={t('nav.prescriptions')} subtitle={t('dashboard.myPrescriptions')} variant="teal" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.sendMessage')} variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label={t('nav.invoices')} subtitle={t('dashboard.billing')} variant="warning" />
              </div>
            </section>
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.calendar')}</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.upcomingAppointments')}</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipPatient')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Receptionist ────────────────────────────────────────── */}
        {primaryRole === 'Receptionist' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.queueAndAppointments')}</h3>
              <div className="stat-grid mb-3">
                {queueStats != null && (
                  <>
                    <Link to="/queue" style={{ textDecoration: 'none' }}>
                      <StatCard title={t('dashboard.waiting')} value={queueStats.waiting ?? 0} icon="⏳" variant="primary" />
                    </Link>
                    <StatCard title={t('dashboard.inProgress')} value={queueStats.inProgress ?? 0} icon="🔄" variant="teal" />
                    <StatCard title={t('dashboard.doneToday')} value={queueStats.done ?? 0} icon="✅" variant="success" />
                  </>
                )}
                <Link to="/appointments" style={{ textDecoration: 'none' }}>
                  <StatCard title={t('dashboard.appointmentsToday')} value={todayAppointments ?? '—'} icon="📅" variant="warning" />
                </Link>
              </div>
            </section>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.shortcuts')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/queue" icon="🔢" label={t('nav.queue')} subtitle={t('dashboard.manageQueue')} variant="primary" />
                <QuickLink to="/appointments" icon="📅" label={t('nav.appointments')} subtitle={t('dashboard.reservations')} variant="teal" />
                <QuickLink to="/patients" icon="👥" label={t('nav.patients')} subtitle={t('dashboard.patientRegistry')} variant="success" />
                <QuickLink to="/billing/invoices" icon="🧾" label={t('nav.invoices')} subtitle={t('dashboard.billing')} variant="warning" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="primary" />
              </div>
            </section>
            <section className="dashboard-section dashboard-widgets-row">
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.calendar')}</h4><MiniCalendar appointmentsByDate={appointmentsByDate} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.upcomingAppointments')}</h4><UpcomingAppointments list={upcomingAppointments} /></CardBody></Card>
              <Card className="dashboard-widget"><CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody></Card>
            </section>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipReceptionist')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Lab Technician ──────────────────────────────────────── */}
        {primaryRole === 'LabTechnician' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.labSection')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/laboratory" icon="🧪" label={t('dashboard.labOrders')} subtitle={t('pages.laboratory.subtitle')} variant="primary" />
                <QuickLink to="/documents" icon="📄" label={t('nav.documents')} subtitle={t('nav.documents')} variant="teal" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="success" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipLab')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Pharmacist ───────────────────────────────────────────── */}
        {primaryRole === 'Pharmacist' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.pharmacySection')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/clinical/prescriptions" icon="💊" label={t('nav.prescriptions')} subtitle={t('dashboard.dispensable')} variant="primary" />
                <QuickLink to="/inventory" icon="📦" label={t('nav.inventory')} subtitle={t('dashboard.stockLevel')} variant="teal" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="success" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipPharmacist')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── HR Manager ────────────────────────────────────────────── */}
        {primaryRole === 'HRManager' && (
          <>
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">{t('dashboard.hrSection')}</h3>
              <div className="dashboard-quick-grid">
                <QuickLink to="/hr/shifts" icon="🕐" label={t('nav.shifts')} subtitle={t('dashboard.roster')} variant="primary" />
                <QuickLink to="/hr/leave" icon="🏖️" label={t('nav.leaveRequests')} subtitle={t('dashboard.approveReject')} variant="teal" />
                <QuickLink to="/settings/users" icon="👥" label={t('dashboard.usersAndRoles')} subtitle={t('dashboard.userList')} variant="success" />
                <QuickLink to="/reports" icon="📊" label={t('nav.reports')} subtitle={t('dashboard.analytics')} variant="warning" />
                <QuickLink to="/messages" icon="✉️" label={t('nav.messages')} subtitle={unreadMessages ? `${unreadMessages} ${t('dashboard.unreadMessages').toLowerCase()}` : t('dashboard.inbox')} variant="primary" />
              </div>
            </section>
            <Card className="dashboard-widget" style={{ maxWidth: 360 }}>
              <CardBody><h4 className="widget-title">{t('dashboard.notes')}</h4><DashboardNotes userId={user?.id} /></CardBody>
            </Card>
            <Card className="dashboard-tip">
              <CardBody>
                <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipHR')}
              </CardBody>
            </Card>
          </>
        )}

        {/* ─── Fallback (role tjetër) ───────────────────────────────── */}
        {!['Admin', 'Doctor', 'Patient', 'Receptionist', 'LabTechnician', 'Pharmacist', 'HRManager'].includes(primaryRole) && (
          <Card>
            <CardBody>
              <h4 className="mb-2">{t('dashboard.title')}</h4>
              <p className="text-secondary mb-0">{t('dashboard.fallback')}</p>
            </CardBody>
          </Card>
        )}
      </div>

      <style>{`
        .dashboard-page { max-width: none; width: 100%; }
        .dashboard-section { margin-bottom: var(--space-6); }
        .dashboard-section-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.7rem;
          margin-bottom: var(--space-3);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }
        .dashboard-quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-3);
        }
        .dashboard-quick-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
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
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .dashboard-quick-link-icon.primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .dashboard-quick-link-icon.teal { background: var(--color-teal-subtle); color: var(--color-teal); }
        .dashboard-quick-link-icon.success { background: var(--color-success-subtle); color: var(--color-success); }
        .dashboard-quick-link-icon.warning { background: var(--color-warning-subtle); color: var(--color-warning); }
        .dashboard-quick-link-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .dashboard-quick-link-label { font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dashboard-quick-link-sub { font-size: var(--font-size-xs); color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dashboard-tip { background: var(--color-primary-subtle); border-color: var(--color-primary); font-size: var(--font-size-sm); }
        .dashboard-charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
        .dashboard-charts-grid .chart-card-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary); }
        .dashboard-charts-grid .chart-span-2 { grid-column: span 2; }
        .dashboard-charts-grid-sm { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        .dashboard-widgets-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
        .dashboard-widgets-row .widget-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-3); color: var(--text-primary); }
        @media (max-width: 1100px) { .dashboard-widgets-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .dashboard-charts-grid { grid-template-columns: 1fr; }
          .dashboard-widgets-row { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </>
  )
}
