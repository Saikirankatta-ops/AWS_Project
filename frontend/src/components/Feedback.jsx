export function Loading({ children = 'Loading...' }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      {children}
    </div>
  )
}

export function ErrorMessage({ children, onRetry }) {
  return (
    <div className="feedback-card error-card" role="alert">
      <span className="feedback-icon" aria-hidden="true">!</span>
      <div>
        <span className="feedback-title">Something went wrong</span>
        <p>{children}</p>
      </div>
      {onRetry && <button className="button button-outline button-small" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">⌕</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}
