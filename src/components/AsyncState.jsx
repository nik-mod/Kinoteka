export default function AsyncState({ type, title, message, onRetry }) {
  return <section className={`async-state ${type}`} aria-live="polite">
    {type === 'loading' && <span className="loader" aria-hidden="true" />}
    <h2>{title}</h2>
    {message && <p>{message}</p>}
    {onRetry && <button className="button secondary" type="button" onClick={onRetry}>თავიდან ცდა</button>}
  </section>
}
