import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Phone, Navigation, Clock, ArrowRight } from 'lucide-react'
import { Section, SectionHead } from '../components/Primitives.jsx'
import { useOpenNow, fmtTime, DAYS } from '../hooks/useOpenNow.js'
import { usePage } from '../page.jsx'

/*
 * The embedded map is the one part of the page that needs the network. It fails
 * in three real situations: the single-file export opened from disk, a preview
 * sandbox with a strict CSP, and any offline viewing. So the address panel is
 * always rendered underneath and the iframe fades in on top once it actually
 * loads — no timeout heuristic that could false-positive on a slow connection
 * and permanently hide a map that was going to arrive.
 */
function MapPanel({ config, embed }) {
  const [ready, setReady] = useState(false)
  const { address, name, mapsUrl, directionsUrl } = config

  return (
    <div className="relative h-full min-h-[320px]">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-10 text-center"
        style={{
          background: 'radial-gradient(circle at 30% 25%, var(--accent-soft), transparent 55%), var(--band)',
        }}
      >
        <span
          className="grid h-12 w-12 place-items-center rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <MapPin size={22} />
        </span>
        <div>
          <p className="display text-[22px]">{name}</p>
          <address className="mt-2 not-italic text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {address?.line1}
            <br />
            {address?.city}, {address?.state} {address?.zip}
          </address>
        </div>
        <a
          href={directionsUrl || mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary !py-3 !px-6 text-[13.5px]"
        >
          <Navigation size={15} /> Open in Google Maps
        </a>
      </div>

      <iframe
        title={`Map to ${name}`}
        src={embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none' }}
        onLoad={() => setReady(true)}
        allowFullScreen
      />
    </div>
  )
}

export function Visit({ config }) {
  const { address, phone, phoneDisplay, hours = [], utcOffsetMinutes, mapsUrl, directionsUrl, amenities = [] } = config
  const status = useOpenNow(hours, utcOffsetMinutes)

  // Keyless Google Maps embed — no API key or billing needed for the iframe.
  // Google's own embed snippet when we have it; a plain address query otherwise.
  const embed =
    config.mapEmbed ||
    `https://maps.google.com/maps?q=${encodeURIComponent(address?.full || '')}&z=15&output=embed`

  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.day === d)).filter(Boolean)

  return (
    <Section id="visit" band>
      <SectionHead title="Find us & opening hours" />

      <div className="mt-14 grid gap-6 lg:grid-cols-5">
        <div className="card reveal overflow-hidden lg:col-span-3" style={{ padding: 0, minHeight: 320 }}>
          <MapPanel config={config} embed={embed} />
        </div>

        <div className="reveal lg:col-span-2" style={{ transitionDelay: '90ms' }}>
          <div className="card h-full p-7 sm:p-8">
            <div className="flex items-center gap-2.5">
              {status.open ? <span className="live-dot" /> : <span className="h-[7px] w-[7px] rounded-full" style={{ background: 'var(--muted)' }} />}
              <span className="text-[13px] font-semibold" style={{ color: status.open ? '#2E7D32' : 'var(--muted)' }}>
                {status.label}
              </span>
            </div>

            <div className="hairline my-6" />

            <div className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <address className="not-italic text-[15px] leading-relaxed">
                {address?.line1}
                <br />
                {address?.city}, {address?.state} {address?.zip}
              </address>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Phone size={17} className="shrink-0" style={{ color: 'var(--accent)' }} />
              <a href={`tel:${phone}`} className="text-[15px] font-semibold hover:underline">{phoneDisplay}</a>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Clock size={17} className="shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Hours</span>
            </div>

            <dl className="mt-3">
              {ordered.map((h) => {
                const today = h.day === status.todayIdx
                return (
                  <div
                    key={h.day}
                    className="flex items-center justify-between border-b py-2.5 text-[14px] last:border-0"
                    style={{
                      borderColor: 'var(--line)',
                      fontWeight: today ? 600 : 400,
                      color: today ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    <dt>{DAYS[h.day]}{today && <span className="ml-2 text-[11px]" style={{ color: 'var(--accent)' }}>TODAY</span>}</dt>
                    <dd className="tabular-nums">{h.closed ? 'Closed' : `${fmtTime(h.open)} – ${fmtTime(h.close)}`}</dd>
                  </div>
                )
              })}
            </dl>

            <a href={directionsUrl || mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-7 w-full">
              <Navigation size={15} /> Get directions
            </a>
          </div>
        </div>
      </div>

      {amenities.length > 0 && (
        <div className="reveal mt-6 flex flex-wrap justify-center gap-2.5">
          {amenities.map((a) => (
            <span
              key={a}
              className="rounded-full px-4 py-2 text-[13px] font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </Section>
  )
}

/** Full-bleed closing CTA. */
export function BookCTA({ config }) {
  const { phone, phoneDisplay, name, hours = [] } = config
  const { links } = usePage()
  const openDays = hours.filter((h) => !h.closed).length
  const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
  return (
    <section className="relative overflow-hidden px-5 sm:px-8 py-24 sm:py-32 text-center" style={{ background: 'var(--invert-bg)' }}>
      <div className="grain" />
      <div className="relative mx-auto max-w-2xl" style={{ color: 'var(--invert-fg)' }}>
        <h2 className="display reveal text-[clamp(30px,5.4vw,54px)]">Book your next visit</h2>
        <p className="reveal mt-5 text-[16px] leading-relaxed opacity-70" style={{ transitionDelay: '70ms' }}>
          Walk-ins are welcome {WORDS[openDays] || openDays} days a week. Call ahead and {name} holds your chair.
        </p>
        <div className="reveal mt-9 flex flex-wrap justify-center gap-3" style={{ transitionDelay: '140ms' }}>
          <a
            href={links.book}
            target={links.bookExternal ? '_blank' : undefined}
            rel={links.bookExternal ? 'noopener noreferrer' : undefined}
            className="btn btn-primary !px-7 !py-4 text-[15px]"
          >
            {links.bookExternal ? 'Book online' : 'Request a time'} <ArrowRight size={16} />
          </a>
          <a href={`tel:${phone}`} className="btn !px-7 !py-4 text-[15px] border border-white/25 text-white hover:bg-white/10">
            <Phone size={15} /> {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  )
}
