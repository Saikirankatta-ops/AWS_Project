const stages = [
  { value: 'PLACED', label: 'Placed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
]

export default function StatusTimeline({ status }) {
  const currentIndex = stages.findIndex((stage) => stage.value === status)

  return (
    <ol className="progress-timeline">
      {stages.map((stage, index) => {
        const complete = currentIndex >= 0 && index < currentIndex
        const current = index === currentIndex
        return (
          <li
            className={`progress-step${complete ? ' complete' : ''}${current ? ' current' : ''}`}
            key={stage.value}
          >
            <span className="progress-marker" aria-hidden="true">
              {complete ? '✓' : current ? '●' : ''}
            </span>
            <span className="progress-label">{stage.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
