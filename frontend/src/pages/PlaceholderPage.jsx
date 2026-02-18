import PageHeader from '../components/layout/PageHeader.jsx'

export default function PlaceholderPage({ title = 'Page', subtitle }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle || 'This page will be implemented in Sprint 5–7.'} />
      <p className="text-secondary">Content coming soon.</p>
    </>
  )
}
