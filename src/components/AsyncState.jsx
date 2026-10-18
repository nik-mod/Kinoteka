import Icon from './Icon.jsx'

export default function AsyncState({ type, title, message, onRetry }) {
  if (type === 'loading') {
    return <section className="async-state" aria-live="polite" aria-busy="true">
      <span className="loader" aria-hidden="true" />
      <h2>{title}</h2>
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <div className="skeleton-card" key={index} />)}
      </div>
    </section>
  }
  return <section className={`async-state ${type}`} aria-live="polite">
    {type === 'error' && <span className="loader" aria-hidden="true" style={{ background: '#B96B52' }} />}
    {type === 'empty' && <Icon name="search" size={30} />}
    <h2>{title}</h2>
    {message && <p>{message}</p>}
    {onRetry && <button className="button secondary" type="button" onClick={onRetry}>თავიდან ცდა</button>}
  </section>
}
