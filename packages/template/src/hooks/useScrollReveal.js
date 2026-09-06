import { useEffect } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
 * Global fade-up for anything tagged `.reveal`. Ported from the Le Water build
 * (water-store/src/App.jsx). Three layers on purpose:
 *   1. IntersectionObserver — the real mechanism
 *   2. MutationObserver     — re-scans when sections mount late (lightbox, menu panels)
 *   3. rAF sweep on scroll  — safety net for browsers where IO fires unreliably
 * Without (3) an unlucky salon site can render permanently invisible content,
 * which is the one bug you can't ship across 200 clients.
 */
export function useScrollReveal() {
  useEffect(() => {
    const SEL = '.reveal:not(.is-in)'

    if (prefersReducedMotion()) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )

    const scan = () => document.querySelectorAll(SEL).forEach((el) => io.observe(el))
    scan()

    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })

    let ticking = false
    const sweep = () => {
      ticking = false
      const vh = window.innerHeight
      document.querySelectorAll(SEL).forEach((el) => {
        const top = el.getBoundingClientRect().top
        if (top < vh * 0.92 && top > -el.offsetHeight) {
          el.classList.add('is-in')
          io.unobserve(el)
        }
      })
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(sweep) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    requestAnimationFrame(sweep)

    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}
