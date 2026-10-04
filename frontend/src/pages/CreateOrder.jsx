import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder, getApiErrorMessage } from '../api/api.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function CreateOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ restaurant: '', amount: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.restaurant.trim()) {
      setError('Enter a restaurant name.')
      return
    }
    if (!Number.isFinite(amount) || amount < 0.01) {
      setError('Enter an amount greater than ₹0.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const order = await createOrder({
        userName: user.username,
        restaurant: form.restaurant.trim(),
        amount,
      })
      setSuccess('Order created successfully.')
      window.setTimeout(() => {
        navigate(`/orders/${encodeURIComponent(order.orderId)}`, {
          state: { notice: 'Order created successfully.' },
        })
      }, 650)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create order. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/orders">Orders</Link><span aria-hidden="true">/</span><span>Create order</span>
      </div>
      <section className="form-page-header">
        <p className="eyebrow">NEW ORDER</p>
        <h1>Create an order</h1>
        <p className="page-subtitle">Add the customer and order details below.</p>
      </section>

      <section className="form-panel">
        {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
        {success && <div className="inline-alert success-alert" role="status">{success}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <span>Customer</span>
            <div className="readonly-value">{user.username}<small>Order will be linked to your account</small></div>
          </div>
          <label className="form-field">
            <span>Restaurant</span>
            <input
              name="restaurant"
              onChange={updateField}
              placeholder="e.g. Pizza House"
              value={form.restaurant}
              required
            />
          </label>
          <label className="form-field">
            <span>Amount</span>
            <div className="amount-input">
              <span aria-hidden="true">₹</span>
              <input
                inputMode="decimal"
                min="0.01"
                name="amount"
                onChange={updateField}
                placeholder="799"
                step="0.01"
                type="number"
                value={form.amount}
                required
              />
            </div>
          </label>
          <div className="form-actions">
            <Link className="button button-quiet" to="/orders">Cancel</Link>
            <button className="button button-primary" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
        <p className="form-note">Your order is saved to the connected MemoryDB-backed service.</p>
      </section>
    </>
  )
}
