import React, { useEffect, useRef, useState } from 'react'
import { initialsFor } from './Masthead.jsx'

export function useSalonIntro(slug, enabled = true) {
  const key = `salon-intro-v2:${slug}`
  const [phase, setPhase] = useState(() => {
    if (typeof window === 'undefined' || !enabled) return 'done'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.location.hash) return 'done'
    try { if (sessionStorage.getItem(key)) return 'done' } catch {}
    return 'opening'
  })
  const finish = () => setPhase('leaving')
  useEffect(() => {
    if (phase === 'done') return
    const timer = setTimeout(() => setPhase(phase === 'opening' ? 'leaving' : 'done'), phase === 'opening' ? 2100 : 650)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduce = () => { if (media.matches) setPhase('done') }
    media.addEventListener('change', reduce)
    return () => { clearTimeout(timer); media.removeEventListener('change', reduce) }
  }, [phase])
  useEffect(() => {
    if (phase === 'done') { try { sessionStorage.setItem(key, 'seen') } catch {} }
  }, [phase, key])
  return [phase, finish]
}

export function SalonIntro({ config, phase, onSkip }) {
  const button = useRef(null)
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    button.current?.focus({ preventScroll: true })
    const escape = e => { if (e.key === 'Escape') onSkip() }
    window.addEventListener('keydown', escape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', escape)
      document.getElementById('top')?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <div className={`salon-intro ${phase === 'leaving' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={`Welcome to ${config.name}`}>
      <div className="intro-shutter intro-shutter-left" /><div className="intro-shutter intro-shutter-right" />
      <div className="intro-grain" />
      <span className="intro-corner">{(config.address?.line1 || '').toUpperCase()}</span>
      <div className="intro-stage">
        <div className="intro-emblem" aria-hidden="true">
          <span className="intro-orbit" /><span className="intro-orbit orbit-two" />
          <svg viewBox="0 0 100 140" className="intro-nail"><defs><linearGradient id="polish" x1="0" x2="1"><stop stopColor="#bb8467"/><stop offset=".5" stopColor="#f4d9bd"/><stop offset="1" stopColor="#c08f76"/></linearGradient></defs><path className="nail-outline" d="M15 110V47C15 0 85 0 85 47V110Q50 134 15 110Z"/><path className="nail-fill" d="M15 110V47C15 0 85 0 85 47V110Q50 134 15 110Z"/><path className="nail-shine" d="M29 82V47Q29 26 44 24"/></svg>
          <span className="intro-initial">{initialsFor(config.name)}</span><span className="intro-sparkle">✧</span>
        </div>
        <h2 className="intro-name">{config.name.split(' ').map((word,i)=><span key={i} style={{'--i':i}}>{word} </span>)}</h2>
        <p className="intro-locality">{config.address?.city} <span>·</span> NAIL STUDIO</p>
        <div className="intro-rule" aria-hidden="true"><span /></div>
      </div>
      <button ref={button} className="intro-skip" onClick={onSkip}>Enter the salon <span aria-hidden="true">↗</span></button>
      <span className="intro-edition" aria-hidden="true">{config.phoneDisplay}</span>
    </div>
  )
}
