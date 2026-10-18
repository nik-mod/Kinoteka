const paths = {
  catalog: <><path d="M4 5.5h16v13H4z" /><path d="M8 5.5v13M16 5.5v13M4 9h4m8 0h4M4 15h4m8 0h4" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
  plus: <><path d="M12 5v14M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="2" /></>,
  login: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h7v18h-7" /></>,
  logout: <><path d="M14 7l-5 5 5 5M9 12h12" /><path d="M10 3H3v18h7" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  play: <><path d="M8 5.5v13l11-6.5z" /><circle cx="12" cy="12" r="9.4" /></>,
  star: <path d="M12 3.4l2.5 5.4 5.9.6-4.4 4 1.2 5.8L12 16.3l-5.2 2.9 1.2-5.8-4.4-4 5.9-.6z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.4 2" /></>,
  film: <><path d="M4 6.5h16v11H4z" /><path d="M8 6.5v11M16 6.5v11M4 10h4m8 0h4M4 14h4m8 0h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.3-3.2 4.1-5 7.5-5s6.2 1.8 7.5 5" /></>,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevronRight: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  arrowUpRight: <><path d="M7 17 17 7" /><path d="M8.5 7H17v8.5" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
}

export default function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
