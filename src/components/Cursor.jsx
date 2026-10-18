import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../gsap.js'
import Icon from './Icon.jsx'

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useLayoutEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      document.documentElement.classList.add('has-custom-cursor')
      const dotX = gsap.quickTo(dot, 'x', { duration: 0.16, ease: 'power3.out' })
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.16, ease: 'power3.out' })
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'expo.out' })
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'expo.out' })
      let shown = false

      const onMove = (event) => {
        if (!shown) {
          shown = true
          gsap.to([dot, ring], { opacity: 1, duration: 0.3 })
        }
        dotX(event.clientX)
        dotY(event.clientY)
        ringX(event.clientX)
        ringY(event.clientY)
      }
      const onOver = (event) => {
        const interactive = event.target.closest('a, button, input, textarea, [data-cursor]')
        const media = event.target.closest('.movie-card, .hero-poster')
        ring.classList.toggle('is-media', Boolean(media))
        ring.classList.toggle('is-active', Boolean(interactive) && !media)
      }
      const onLeaveWindow = () => {
        shown = false
        gsap.to([dot, ring], { opacity: 0, duration: 0.25 })
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerover', onOver, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeaveWindow)
      return () => {
        document.documentElement.classList.remove('has-custom-cursor')
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerover', onOver)
        document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      }
    })
    return () => mm.revert()
  }, [])

  return <>
    <span className="cursor-dot" ref={dotRef} aria-hidden="true" />
    <span className="cursor-ring" ref={ringRef} aria-hidden="true"><Icon name="plus" size={12} /></span>
  </>
}
