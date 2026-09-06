import React from 'react'
import { Phone, MapPin, Instagram, Facebook, Star } from 'lucide-react'
import { Masthead } from '../components/Masthead.jsx'
import { fmtTime, DAYS } from '../hooks/useOpenNow.js'
import { navFor } from './Header.jsx'
import { usePage } from '../page.jsx'

export function Footer({ config }) {
  const { name, address, phone, phoneDisplay, hours = [], social = {}, mapsUrl, rating, reviewCount, showRating = true } = config
  const year = new Date().getFullYear()
  const { page } = usePage()
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.day === d)).filter(Boolean)

  return (
    <footer className="border-t px-5 sm:px-8 py-16" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
      <div className="mx-auto max-w-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-start">
            <Masthead config={config} variant="stacked" className="!items-start !text-left" />
            {rating && showRating ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>
                <Star size={12} className="fill-current" style={{ color: '#F4B400' }} />
                {rating.toFixed(1)} · {reviewCount?.toLocaleString()} Google reviews
              </a>
            ) : null}
            {(social.instagram || social.facebook) && (
              <div className="mt-5 flex gap-3">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                     className="grid h-9 w-9 place-items-center rounded-full transition"
                     style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <Instagram size={16} />
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                     className="grid h-9 w-9 place-items-center rounded-full transition"
                     style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <Facebook size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Contact</h3>
            <a href={`tel:${phone}`} className="mt-4 flex items-center gap-2.5 text-[14.5px] hover:underline">
              <Phone size={15} style={{ color: 'var(--accent)' }} /> {phoneDisplay}
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-start gap-2.5 text-[14.5px] leading-relaxed hover:underline">
              <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span>{address?.line1}<br />{address?.city}, {address?.state} {address?.zip}</span>
            </a>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Hours</h3>
            <dl className="mt-4 space-y-1.5 text-[13.5px]" style={{ color: 'var(--muted)' }}>
              {ordered.map((h) => (
                <div key={h.day} className="flex justify-between gap-4">
                  <dt>{DAYS[h.day].slice(0, 3)}</dt>
                  <dd className="tabular-nums">{h.closed ? 'Closed' : `${fmtTime(h.open)} – ${fmtTime(h.close)}`}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Explore</h3>
            <nav className="mt-4 space-y-2.5 text-[14.5px]">
              {navFor(config, page).filter((n) => n.key !== 'book').map(({ label: l, href: h }) => (
                <a key={h} href={h} className="block hover:underline" style={{ color: 'var(--muted)' }}>{l}</a>
              ))}
            </nav>
          </div>
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col items-center justify-between gap-3 text-[12.5px] sm:flex-row" style={{ color: 'var(--muted)' }}>
          <p>© {year} {name}. All rights reserved.</p>
          <p>{address?.city}, {address?.state} · Walk-ins welcome</p>
        </div>
      </div>
    </footer>
  )
}
