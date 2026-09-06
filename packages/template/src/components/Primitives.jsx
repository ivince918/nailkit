import React, { useEffect, useState, useCallback } from 'react'
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../hooks/useScrollReveal.js'

/** Headline that rises one word at a time. Ported from water-store's WordReveal. */
export function WordReveal({ text = '', as: Tag = 'span', className = '', style, perWord = 60, delay = 0 }) {
  const words = String(text).split(' ')
  return (
    <Tag className={className} style={style}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span className="word-rise" style={{ animationDelay: `${delay + i * perWord}ms` }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </Tag>
  )
}

export function Stars({ rating = 5, size = 14, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'fill-current' : 'opacity-25'}
          style={{ color: '#F4B400' }}
          aria-hidden
        />
      ))}
    </span>
  )
}

/** Section wrapper — consistent rhythm and max-width across every block. */
export function Section({ id, className = '', band = false, children, style }) {
  return (
    <section
      id={id}
      className={`px-5 sm:px-8 py-20 sm:py-28 ${className}`}
      style={{ background: band ? 'var(--band)' : undefined, ...style }}
    >
      <div className="mx-auto max-w-shell">{children}</div>
    </section>
  )
}

export function SectionHead({ title, blurb, center = true, className = '' }) {
  return (
    <div className={`${center ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'} ${className}`}>
      <h2 className="display reveal text-[clamp(30px,5vw,52px)]">
        {title}
      </h2>
      {blurb && (
        <p className="reveal mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--muted)', transitionDelay: '120ms' }}>
          {blurb}
        </p>
      )}
    </div>
  )
}

/** Full-screen photo viewer with keyboard nav. Mounted only while open. */
export function Lightbox({ photos, index, onClose, onIndex }) {
  const reduce = prefersReducedMotion()

  const step = useCallback(
    (dir) => onIndex((index + dir + photos.length) % photos.length),
    [index, photos.length, onIndex]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, step])

  const photo = photos[index]

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/92 p-4 ${reduce ? '' : 'lb-backdrop'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition"
      >
        <X size={20} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); step(-1) }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); step(1) }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <figure className={reduce ? '' : 'lb-figure'} onClick={(e) => e.stopPropagation()}>
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt || ''}
          className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain"
        />
        <figcaption className="mt-3 text-center text-xs text-white/50">
          {index + 1} / {photos.length}
          {photo.attribution ? ` · Photo: ${photo.attribution}` : ''}
        </figcaption>
      </figure>
    </div>
  )
}

/** Thin accent bar tracking scroll depth. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      const h = document.documentElement.scrollHeight - window.innerHeight
      setPct(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed top-0 left-0 z-[70] h-[2px] w-full bg-transparent" aria-hidden>
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%`, background: 'var(--accent)' }}
      />
    </div>
  )
}
