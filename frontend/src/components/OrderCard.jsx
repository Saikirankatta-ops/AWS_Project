import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function OrderCard({ order }) {
  return (
    <article className="order-card">
      <div className="order-card-top">
        <span className="order-number">#{order.orderId}</span>
        <StatusBadge status={order.status} />
      </div>
      <div className="order-card-main">
        <div className="restaurant-avatar" aria-hidden="true">✦</div>
        <div className="order-card-title">
          <h3>{order.restaurant}</h3>
          <p>{order.userName}</p>
        </div>
      </div>
      <div className="order-card-bottom">
        <strong>{currency.format(Number(order.amount))}</strong>
        <Link className="button button-outline button-small" to={`/orders/${encodeURIComponent(order.orderId)}`}>
          View Order <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
