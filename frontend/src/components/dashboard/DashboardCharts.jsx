import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

const CHART_COLORS = ['#2563eb', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d']

export function StatusPieChart({ data }) {
  if (!data?.length) return <p className="text-secondary text-sm">Nuk ka të dhëna</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyTrendChart({ data }) {
  if (!data?.length) return <p className="text-secondary text-sm">Nuk ka të dhëna</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-gray-600)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--color-gray-600)" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="count" name="Takime" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PerDoctorBarChart({ data }) {
  if (!data?.length) return <p className="text-secondary text-sm">Nuk ka të dhëna</p>
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--color-gray-600)" />
        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10 }} stroke="var(--color-gray-600)" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" name="Takime" fill="var(--color-teal)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SpecialtiesBarChart({ data }) {
  if (!data?.length) return <p className="text-secondary text-sm">Nuk ka të dhëna</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--color-gray-600)" angle={-25} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--color-gray-600)" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" name="Takime" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
