import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage, getOrder, getOrderHistory, updateOrderStatus } from '../api/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { ErrorMessage, Loading } from '../components/Feedback.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

const stages = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']
const nextAction = {
  PLACED: { status: 'ACCEPTED', label: 'Accept order' },
  ACCEPTED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  OUT_FOR_DELIVERY: { status: 'DELIVERED', label: 'Mark delivered' },
}
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice ?? '')

  const loadOrder = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orderResult, historyResult] = await Promise.all([
        getOrder(orderId),
        getOrderHistory(orderId),
      ])
      setOrder(orderResult)
      setHistory(Array.isArray(historyResult) ? historyResult : [])
      return true
    } catch (requestError) {
      setOrder(null)
      setError(getApiErrorMessage(requestError, 'Unable to load this order. Please try again.'))
      return false
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  async function handleStatusUpdate(status) {
    if (!stages.includes(status) || updating) return
    setUpdating(true)
    setError('')
    setNotice('')
    try {
      await updateOrderStatus(orderId, status)
      const refreshed = await loadOrder()
      if (refreshed) setNotice('Order status updated successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update order status. Please try again.'))
    } finally {
      setUpdating(false)
    }
  }

  const action = order && user?.role === 'OWNER' ? nextAction[order.status] : null

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/orders">Orders</Link><span aria-hidden="true">/</span><span>Order #{orderId}</span>
      </div>
      {loading ? <Loading /> : error && !order ? (
        <ErrorMessage onRetry={loadOrder}>{error}</ErrorMessage>
      ) : order ? (
        <>
          {notice && <div className="inline-alert success-alert" role="status">{notice}</div>}
          {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
          <section className="detail-header">
            <div>
              <p className="eyebrow">ORDER DETAILS</p>
              <h1>Order <span className="muted-heading">#{order.orderId}</span></h1>
              <p className="page-subtitle">Follow this order from placement through delivery.</p>
            </div>
            <StatusBadge status={order.status} />
          </section>

          <div className="details-layout">
            <div className="details-main">
              <section className="detail-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">ORDER PROGRESS</p>
                    <h2>Status timeline</h2>
                  </div>
                  {action && (
                    <button
                      className="button button-primary"
                      disabled={updating}
                      onClick={() => handleStatusUpdate(action.status)}
                      type="button"
                    >
                      {updating ? 'Updating...' : action.label}
                    </button>
                  )}
                </div>
                <StatusTimeline status={order.status} />
              </section>

              <section className="detail-panel history-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">ORDER ACTIVITY</p>
                    <h2>Status history</h2>
                  </div>
                  <span className="history-count">{history.length} updates</span>
                </div>
                {history.length ? (
                  <ol className="history-list">
                    {history.map((event, index) => (
                      <li className="history-item" key={`${event.status}-${event.timestamp}-${index}`}>
                        <span className={`history-marker status-${String(event.status).toLowerCase()}`} aria-hidden="true">✓</span>
                        <div className="history-copy">
                          <strong>{event.status?.replaceAll('_', ' ')}</strong>
                          <time dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : <p className="muted-text">No status history is available yet.</p>}
              </section>
            </div>

            <aside className="detail-panel summary-panel">
              <p className="eyebrow">ORDER SUMMARY</p>
              <h2>Order information</h2>
              <dl className="order-summary">
                <div><dt>Customer</dt><dd>{order.userName}</dd></div>
                <div><dt>Restaurant</dt><dd>{order.restaurant}</dd></div>
                <div><dt>Amount</dt><dd className="summary-amount">{currency.format(Number(order.amount))}</dd></div>
                <div><dt>Current Status</dt><dd><StatusBadge status={order.status} /></dd></div>
                <div><dt>Created</dt><dd>{formatDate(order.createdAt)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(order.updatedAt)}</dd></div>
              </dl>
              <Link className="button button-outline full-width" to="/orders">Back to orders</Link>
            </aside>
          </div>
        </>
      ) : null}
    </>
  )
}
