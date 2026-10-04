import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage, getOrders } from '../api/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function Orders() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <>
      <section className="page-title-row">
        <div>
          <p className="eyebrow">ORDER MANAGEMENT</p>
          <h1>{isOwner ? 'Order Queue' : 'My Orders'}</h1>
          <p className="page-subtitle">
            {isOwner
              ? 'Oldest active order first. Process orders fairly, first come, first served.'
              : 'Track your orders from the kitchen to delivery.'}
          </p>
        </div>
        {!isOwner && <Link className="button button-primary" to="/orders/new"><span aria-hidden="true">＋</span> Create Order</Link>}
      </section>

      <section className="table-panel">
        <div className="table-panel-heading">
          <div>
            <h2>{isOwner ? 'Queue · oldest active first' : 'Your orders'}</h2>
            {!loading && !error && <p>{orders.length} {orders.length === 1 ? 'order' : 'orders'} total</p>}
          </div>
        </div>
        {loading ? <Loading /> : error ? <ErrorMessage onRetry={loadOrders}>{error}</ErrorMessage> : orders.length ? (
          <div className="table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="table-order-id">#{order.orderId}</td>
                    <td>{order.userName}</td>
                    <td>{order.restaurant}</td>
                    <td className="table-amount">{currency.format(Number(order.amount))}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <Link className="button button-outline button-small" to={`/orders/${encodeURIComponent(order.orderId)}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No orders found"
            action={!isOwner && <Link className="button button-primary" to="/orders/new">Create an order</Link>}
          >
            {isOwner ? 'Customer orders will appear here when they are placed.' : 'Place your first order to see it listed here.'}
          </EmptyState>
        )}
      </section>
    </>
  )
}
