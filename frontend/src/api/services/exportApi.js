import { api } from '../axios.js'

const EXT_BY_FORMAT = { csv: 'csv', xlsx: 'xlsx', json: 'json', pdf: 'pdf', docx: 'docx' }

/**
 * Trigger file download for export.
 * @param {'appointments'|'patients'|'invoices'} resource
 * @param {'csv'|'xlsx'|'json'|'pdf'|'docx'} format
 * @param {Record<string, string>} [params] - optional query params (e.g. status, fromUtc, toUtc, patientId)
 */
export async function downloadExport(resource, format, params = {}) {
  const ext = EXT_BY_FORMAT[format] ?? format
  const qs = new URLSearchParams({ format, ...params }).toString()
  const url = `/export/${resource}${qs ? `?${qs}` : ''}`
  const res = await api.get(url, { responseType: 'blob' })
  const blob = res.data
  const disposition = res.headers['content-disposition']
  let filename = `${resource}_${new Date().toISOString().slice(0, 10)}.${ext}`
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/i)
    if (match) filename = match[1].trim()
  }
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const exportApi = {
  download: downloadExport,
}
