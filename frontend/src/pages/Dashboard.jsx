import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage, getHealth, getOrders } from '../api/api.js'
import OrderCard from '../components/OrderCard.jsx'
import StatCard from '../components/StatCard.jsx'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const [orders, setOrders] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    const [ordersResult, healthResult] = await Promise.allSettled([getOrders(), getHealth()])

    if (ordersResult.status === 'fulfilled') {
      setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : [])
    } else {
      setError(getApiErrorMessage(ordersResult.reason))
    }
    setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const activeCount = orders.filter((order) => order.status !== 'DELIVERED').length
  const deliveredCount = orders.filter((order) => order.status === 'DELIVERED').length
  const recentOrders = isOwner
    ? orders.slice(0, 3)
    : [...orders]
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      .slice(0, 3)
  const connected = health?.status === 'UP' && health?.memoryDB === 'CONNECTED'
  const storageLabel = health?.storageTarget === 'LOCAL_REDIS'
    ? 'Local Redis'
    : health?.storageTarget === 'CONFIGURED_REDIS_ENDPOINT'
      ? 'Configured Redis endpoint'
      : 'Redis datastore'

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ORDER OPERATIONS</p>
          <h1>Good food, flowing smoothly.</h1>
          <p className="page-subtitle">Real-Time Food Order Management</p>
        </div>
        <div className={`connection-pill ${connected ? 'connected' : 'disconnected'}`} aria-live="polite">
          <span className="connection-dot" />
          {connected ? `${storageLabel} Connected` : `${storageLabel} Disconnected`}
        </div>
      </section>

      <section className="stats-grid" aria-label="Order statistics">
        <StatCard label="Total Orders" value={loading ? '—' : orders.length} detail="Across all orders" icon="▤" tone="purple" />
        <StatCard label="Active Orders" value={loading ? '—' : activeCount} detail="Currently in progress" icon="◷" tone="orange" />
        <StatCard label="Delivered Orders" value={loading ? '—' : deliveredCount} detail="Successfully completed" icon="✓" tone="green" />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isOwner ? 'FIRST COME, FIRST SERVED' : 'LATEST ACTIVITY'}</p>
            <h2>{isOwner ? 'Order Queue' : 'My Recent Orders'}</h2>
          </div>
          <Link className="text-link" to="/orders">{isOwner ? 'View queue' : 'View all orders'} <span aria-hidden="true">→</span></Link>
        </div>
        {loading ? <Loading /> : error ? <ErrorMessage onRetry={loadDashboard}>{error}</ErrorMessage> : recentOrders.length ? (
          <div className="order-card-grid">
            {recentOrders.map((order) => <OrderCard key={order.orderId} order={order} />)}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            action={!isOwner && <Link className="button button-primary" to="/orders/new">Create an order</Link>}
          >
            {isOwner ? 'New customer orders will appear here as they come in.' : 'Place your first order to see it here.'}
          </EmptyState>
        )}
      </section>

      <section className="memorydb-banner">
        <div className="banner-icon" aria-hidden="true">✦</div>
        <div>
          <p className="eyebrow">BUILT FOR THE MOMENT</p>
          <h2>Fast updates. Durable orders.</h2>
          <p>Connect a MemoryDB cluster endpoint for its durable in-memory store. Local development uses Redis at localhost:6379.</p>
        </div>
      </section>
    </>
  )
}
