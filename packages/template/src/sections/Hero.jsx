import React, { useRef } from 'react'
import { ArrowUpRight, ArrowDown, Phone } from 'lucide-react'
import { useOpenNow, fmtTime } from '../hooks/useOpenNow.js'
import { usePage } from '../page.jsx'

export function Hero({ config }) {
  const ref = useRef(null)
  const bg = config.heroImage || config.photos?.[0]
  const status = useOpenNow(config.hours, config.utcOffsetMinutes)
  const { links } = usePage()
  const today = (config.hours || []).find((h) => h.day === status.todayIdx)
  const todayLine = !today ? 'Plan your visit' : today.closed ? 'Closed today' : `Open ${fmtTime(today.open)} to ${fmtTime(today.close)}`
  const move = e => {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    const box = e.currentTarget.getBoundingClientRect()
    ref.current?.style.setProperty('--hero-x', `${(e.clientX - box.left - box.width / 2) * .009}px`)
    ref.current?.style.setProperty('--hero-y', `${(e.clientY - box.top - box.height / 2) * .009}px`)
  }
  return (
    <section id="top" ref={ref} tabIndex={-1} className="campaign-hero" onPointerMove={move} onPointerLeave={() => { ref.current?.style.setProperty('--hero-x', '0px'); ref.current?.style.setProperty('--hero-y', '0px') }}>
      {bg?.src && <div className="campaign-image"><img src={bg.src} srcSet={bg.srcSm ? `${bg.srcSm} ${bg.smallWidth || 800}w, ${bg.src} ${bg.width || 1672}w` : undefined} sizes="100vw" width={bg.width} height={bg.height} alt="" fetchpriority="high" decoding="async" /></div>}
      {!bg?.src && <div className="blank-hero" aria-label="Hero image placeholder"><span>YOUR SIGNATURE IMAGE</span></div>}
      <div className="campaign-shade" />
      <div className="campaign-inner">
        <div className="campaign-copy">
          <p className="campaign-eyebrow hero-enter"><span /> {config.address?.city}, {config.address?.state} <span className="eyebrow-rule" /> {config.name}</p>
          <h1 className="campaign-title"><span className="hero-line"><span>Beautiful nails.</span></span><span className="hero-line"><em>A moment</em></span><span className="hero-line"><em>for you.</em><span className="title-star" aria-hidden="true">✧</span></span></h1>
          <p className="campaign-description hero-enter">{config.hero?.sub || 'A fresh set. A slower moment. A little time for you.'}</p>
          <div className="campaign-actions hero-enter"><a className="campaign-book" href={links.book}>Request a time <span><ArrowUpRight size={20}/></span></a><a href="#services" className="campaign-menu">See the menu <ArrowDown size={14}/></a></div>
          <div className="campaign-status hero-enter"><span className={status.open ? 'live-dot' : 'status-dot'} />{status.label || 'Call us to plan your visit'}<a href={`tel:${config.phone}`} aria-label={`Call ${config.phoneDisplay}`}><Phone size={13}/>{config.phoneDisplay}</a></div>
        </div>
        <a className="hero-visit-card hero-enter" href={links.book}><span className="visit-card-top"><span>TODAY</span><ArrowUpRight size={20}/></span><strong>{todayLine}</strong><span className="visit-card-bottom">Plan your visit · Request a time <span>↗</span></span></a>
      </div>
      {bg?.sourceUrl && <a className="hero-source" href={bg.sourceUrl} target="_blank" rel="noopener noreferrer">Photo: {bg.attribution || 'Google Maps'}</a>}
    </section>
  )
}
