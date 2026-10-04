const statusLabels = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
}

export default function StatusBadge({ status }) {
  const normalized = statusLabels[status] ? status : 'PLACED'
  return <span className={`status-badge status-${normalized.toLowerCase()}`}>{statusLabels[normalized]}</span>
}
