import React, { useState } from 'react'
import { api } from '../api/axios.js'
import Spinner from './Spinner.jsx'

export default function PaymentModal({ payment, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState('CreditCard')
  const [cardNumber, setCardNumber] = useState('')
  const [result, setResult] = useState(null)

  async function confirmPayment() {
    setStep(3)
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await api.post(`/payments/${payment.id}/pay`, {
        paymentMethod: method,
        cardNumber: cardNumber || undefined
      })
      setResult(res.data)
      setStep(4)
      if (res.data.success) onSuccess({ ...payment, status: 'Paid' })
    } catch (e) {
      setResult({ success: false, message: e?.response?.data?.error || 'Payment failed.' })
      setStep(4)
    }
  }

  const methods = [
    { value: 'CreditCard', label: 'Credit / Debit Card' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'BankTransfer', label: 'Bank Transfer' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24
    }}>
      <div style={{
        background: 'var(--white, #fff)', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Step indicators */}
        <div className="flex gap-2 mb-4" style={{ justifyContent: 'center' }}>
          {['Summary', 'Method', 'Processing', 'Result'].map((label, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= i + 1 ? 'var(--primary, #6366f1)' : '#e5e7eb',
                color: step >= i + 1 ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, margin: '0 auto 4px'
              }}>{i + 1}</div>
              <div style={{ fontSize: 10, color: step >= i + 1 ? 'var(--primary, #6366f1)' : '#9ca3af' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* STEP 1 - Order Summary */}
        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Order Summary</h3>
            <div className="list">
              <div className="item">
                <div className="text-sm text-muted">Appointment</div>
                <div className="font-semibold">{new Date(payment.appointmentDate).toLocaleString()}</div>
              </div>
              <div className="item">
                <div className="text-sm text-muted">Doctor</div>
                <div className="font-semibold">Dr. {payment.doctor}</div>
              </div>
              {payment.reason && (
                <div className="item">
                  <div className="text-sm text-muted">Reason</div>
                  <div>{payment.reason}</div>
                </div>
              )}
              <div className="item">
                <div className="text-sm text-muted">Total Amount</div>
                <div className="font-semibold" style={{ fontSize: 22, color: 'var(--primary, #6366f1)' }}>
                  {payment.amount.toFixed(2)} {payment.currency}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ flex: 1 }}>Continue to Payment</button>
            </div>
          </div>
        )}

        {/* STEP 2 - Payment Method */}
        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Select Payment Method</h3>
            <div className="form-stack">
              {methods.map(m => (
                <div
                  key={m.value}
                  className="item"
                  onClick={() => setMethod(m.value)}
                  style={{
                    cursor: 'pointer',
                    borderColor: method === m.value ? 'var(--primary, #6366f1)' : undefined,
                    background: method === m.value ? 'rgba(99,102,241,0.08)' : undefined
                  }}
                >
                  <div className="flex-between">
                    <span className="font-semibold text-sm">{m.label}</span>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${method === m.value ? 'var(--primary, #6366f1)' : '#d1d5db'}`,
                      background: method === m.value ? 'var(--primary, #6366f1)' : 'transparent'
                    }} />
                  </div>
                </div>
              ))}

              {method === 'CreditCard' && (
                <div className="form-group">
                  <label>Card Number (simulated)</label>
                  <input
                    placeholder="4111 1111 1111 1111"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                  <span className="text-xs text-muted">Any number accepted - this is a simulation</span>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button className="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                <button onClick={confirmPayment} style={{ flex: 1 }}>
                  Confirm - {payment.amount.toFixed(2)} {payment.currency}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Processing */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner />
            <div className="font-semibold" style={{ marginTop: 16 }}>Processing your payment...</div>
            <div className="text-sm text-muted" style={{ marginTop: 8 }}>Please do not close this window</div>
          </div>
        )}

        {/* STEP 4 - Result */}
        {step === 4 && result && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {result.success ? '\u2705' : '\u274C'}
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
              {result.success ? 'Payment Successful!' : 'Payment Failed'}
            </h3>
            <div className={`alert ${result.success ? 'alert-success' : 'alert-error'} mb-4`}
              style={{ textAlign: 'left' }}>
              {result.message}
            </div>
            {result.success && result.externalReference && (
              <div className="text-sm text-muted mb-4">
                Receipt #: <strong>{result.externalReference}</strong>
              </div>
            )}
            {result.success && result.paymentMethod && (
              <div className="text-sm text-muted mb-4">
                Method: <strong>{result.paymentMethod}</strong>
              </div>
            )}
            <div className="flex gap-2">
              {!result.success && (
                <button className="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
                  Try Again
                </button>
              )}
              <button onClick={onClose} style={{ flex: 1 }}>
                {result.success ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
