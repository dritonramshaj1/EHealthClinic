import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { prescriptionsApi } from '../../api/services/prescriptionsApi.js'
import { labApi } from '../../api/services/labApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function MedicalHistoryPage() {
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsApi.list().then(r => setAppointments(r.data || [])).catch(() => {}),
      prescriptionsApi.list().then(r => setPrescriptions(r.data || [])).catch(() => {}),
      labApi.listOrders().then(r => setLabOrders(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner center label="Loading..." />

  const apptColumns = [
    { key: 'startsAtUtc', header: 'Date', render: row => formatDate(row.startsAtUtc) },
    { key: 'doctor', header: 'Doctor', render: row => row.doctor?.name ?? '—' },
    { key: 'reason', header: 'Reason', render: row => row.reason || '—' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
  ]

  const rxColumns = [
    { key: 'issuedAtUtc', header: 'Date', render: row => formatDate(row.issuedAtUtc) },
    { key: 'doctorName', header: 'Doctor' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
  ]

  const labColumns = [
    { key: 'orderedAtUtc', header: 'Date', render: row => formatDate(row.orderedAtUtc) },
    { key: 'doctorName', header: 'Doctor' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
  ]

  return (
    <>
      <PageHeader
        title="Medical History"
        subtitle="Your complete health record overview"
      />
      <Card className="mb-4">
        <CardHeader title={`Appointments (${appointments.length})`} />
        <CardBody className="p-0">
          <Table columns={apptColumns} data={appointments} emptyMessage="No appointments" emptyIcon="📅" />
        </CardBody>
      </Card>
      <Card className="mb-4">
        <CardHeader title={`Prescriptions (${prescriptions.length})`} />
        <CardBody className="p-0">
          <Table columns={rxColumns} data={prescriptions} emptyMessage="No prescriptions" emptyIcon="💊" />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={`Lab Orders (${labOrders.length})`} />
        <CardBody className="p-0">
          <Table columns={labColumns} data={labOrders} emptyMessage="No lab orders" emptyIcon="🧪" />
        </CardBody>
      </Card>
    </>
  )
}
