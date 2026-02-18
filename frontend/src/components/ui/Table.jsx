import EmptyState from './EmptyState.jsx'
import Spinner from './Spinner.jsx'

export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon = '📭',
  onRowClick,
  striped = false,
}) {
  if (loading) return <Spinner center label="Loading..." />

  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyMessage} />
  }

  return (
    <div className="table-container">
      <table className={`table${striped ? ' table-striped' : ''}`}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.width ? { width: col.width } : {}}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr
              key={row.id || ri}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : {}}
            >
              {columns.map((col, ci) => (
                <td key={ci}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
