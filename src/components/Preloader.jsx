import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../gsap.js'

const SESSION_FLAG = 'kinoteka-intro-played'

export default function Preloader() {
  const [skip] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_FLAG) === '1' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return true
    }
  })
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (skip || !rootRef.current) return undefined
    const root = rootRef.current
    const counter = { value: 0 }
    const countEl = root.querySelector('.preloader-count')
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        onComplete: () => {
          try { sessionStorage.setItem(SESSION_FLAG, '1') } catch { /* private mode */ }
          root.remove()
        },
      })
      timeline
        .fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo('.preloader-mark', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.1)
        .to('.preloader-line span', { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0.35)
        .to(counter, {
          value: 100,
          duration: 1.05,
          ease: 'power2.inOut',
          onUpdate: () => { if (countEl) countEl.textContent = `${String(Math.round(counter.value)).padStart(3, '0')} %` },
        }, 0.35)
        .to('.preloader-center', { y: -18, opacity: 0, duration: 0.4, ease: 'power2.in' }, '+=0.15')
        .to('.preloader-panel.top', { yPercent: -101, duration: 0.75, ease: 'power4.inOut' }, '-=0.1')
        .to('.preloader-panel.bottom', { yPercent: 101, duration: 0.75, ease: 'power4.inOut' }, '<')
        .to(root, { opacity: 0, duration: 0.25 }, '-=0.25')
      return () => timeline.kill()
    })
    return () => mm.revert()
  }, [skip])

  if (skip) return null
  return <div className="preloader" ref={rootRef} aria-hidden="true">
    <div className="preloader-panel top" />
    <div className="preloader-panel bottom" />
    <div className="preloader-center">
      <span className="preloader-mark">K</span>
      <div className="preloader-line"><span /></div>
      <span className="preloader-count">000 %</span>
    </div>
  </div>
}
