import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-col">
        <Link to="/" className="footer-brand" aria-label="კინოთეკა — მთავარი გვერდი">
          <span className="brand-mark"><Icon name="film" size={21} /></span>
          <span className="brand-name">კინოთეკა</span>
        </Link>
        <p className="footer-tagline">პირადი კინოარქივი — კატალოგი, ფავორიტები და აღწერები ერთ მშვიდ სივრცეში.</p>
      </div>
      <nav className="footer-col" aria-label="ფუტერის ნავიგაცია">
        <h3>ნავიგაცია</h3>
        <ul>
          <li><Link to="/">კატალოგი</Link></li>
          <li><Link to="/favorites">ფავორიტები</Link></li>
          <li><Link to="/add-movie">ფილმის დამატება</Link></li>
        </ul>
      </nav>
      <div className="footer-col">
        <h3>არქივი</h3>
        <ul>
          <li><Link to="/login">შესვლა</Link></li>
          <li><Link to="/register">რეგისტრაცია</Link></li>
        </ul>
      </div>
    </div>
    <div className="footer-meta">
      <span>© 2026 კინოთეკა</span>
      <span>აგებულია კინოს სიყვარულით <Icon name="film" size={13} /></span>
    </div>
    <span className="footer-wordmark" aria-hidden="true">კინოთეკა</span>
  </footer>
}
