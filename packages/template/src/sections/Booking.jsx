import React, { useState, useMemo, useEffect } from 'react'
import { Calendar, Clock, Check, Phone, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Section, SectionHead } from '../components/Primitives.jsx'
import { fmtTime, DAYS } from '../hooks/useOpenNow.js'

/*
 * Request-to-book, not real-time booking.
 *
 * The slots below are generated from the salon's posted opening hours — they
 * are times the salon is OPEN, not times a chair is confirmed free. Nothing
 * here checks a calendar, so every string the customer reads says "request"
 * and the confirmation promises a text back rather than a booked appointment.
 * Getting that wording wrong would have people turning up to a full salon.
 */

const SLOT_MINUTES = 30
const LEAD_MINUTES = 60 // don't offer a slot less than an hour out

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHHMM = (mins) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

/** "Now" in the salon's timezone, so a visitor in another state sees the salon's clock. */
function salonNow(utcOffsetMinutes) {
  const now = new Date()
  if (utcOffsetMinutes === null || utcOffsetMinutes === undefined) return now
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + utcOffsetMinutes * 60000)
}

/** Fourteen days starting today, each flagged with whether the salon is open. */
function buildDays(hours, utcOffsetMinutes, count = 14) {
  const base = salonNow(utcOffsetMinutes)
  base.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const rule = hours.find((h) => h.day === d.getDay())
    return {
      date: d,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      weekday: DAYS[d.getDay()].slice(0, 3),
      dayNum: d.getDate(),
      isToday: i === 0,
      closed: !rule || rule.closed,
      rule,
    }
  })
}

function buildSlots(day, utcOffsetMinutes) {
  if (!day || day.closed || !day.rule) return []
  const open = toMinutes(day.rule.open)
  let close = toMinutes(day.rule.close)
  if (close <= open) close += 1440

  // Leave a full slot before closing so the last request is actually servable.
  const last = close - SLOT_MINUTES
  let earliest = open
  if (day.isToday) {
    const now = salonNow(utcOffsetMinutes)
    const cutoff = now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES
    earliest = Math.max(open, Math.ceil(cutoff / SLOT_MINUTES) * SLOT_MINUTES)
  }

  const out = []
  for (let m = earliest; m <= last; m += SLOT_MINUTES) out.push(toHHMM(m))
  return out
}

export function Booking({ config, heading = 'h2' }) {
  const {
    hours = [], utcOffsetMinutes, services = [], name,
    phone, phoneDisplay, bookingUrl, slug,
  } = config

  const days = useMemo(() => buildDays(hours, utcOffsetMinutes), [hours, utcOffsetMinutes])
  const firstOpen = days.find((d) => !d.closed && buildSlots(d, utcOffsetMinutes).length)

  const [dayKey, setDayKey] = useState(firstOpen?.key || days[0]?.key)
  const [service, setService] = useState('')
  const [time, setTime] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', note: '' })
  const [state, setState] = useState('idle') // idle | sending | done | offline | error

  const day = days.find((d) => d.key === dayKey)
  const slots = useMemo(() => buildSlots(day, utcOffsetMinutes), [day, utcOffsetMinutes])

  // Changing the day invalidates a time picked on the previous one.
  useEffect(() => { setTime('') }, [dayKey])

  // Flattening every service into one chip row was 26 chips — thirteen rows on a
  // phone before the date picker came into view. Category first, then services
  // within it, keeps the visible choice to roughly ten chips.
  const [category, setCategory] = useState(0)
  useEffect(() => {
    const select = e => {
      const index = services.findIndex(c => c.items.some(item => (typeof item === 'string' ? item : item.name) === e.detail))
      if (index >= 0) { setCategory(index); setService(e.detail) }
    }
    window.addEventListener('salon:select-service', select)
    // Arriving from a service link on another page: /book/?service=Gel%20Manicure
    const wanted = new URLSearchParams(window.location.search).get('service')
    if (wanted) select({ detail: wanted })
    return () => window.removeEventListener('salon:select-service', select)
  }, [services])
  const allServices = useMemo(
    () => services.flatMap((c) => c.items.map((i) => ({ label: typeof i === 'string' ? i : i.name, category: c.name }))),
    [services]
  )

  if (!hours.length || !allServices.length) return null

  const ready = service && time && form.name.trim() && form.phone.replace(/\D/g, '').length >= 10

  const summary = day
    ? `${service} · ${DAYS[day.date.getDay()]} ${day.date.getMonth() + 1}/${day.dayNum} at ${fmtTime(time)}`
    : ''

  /** Prefilled SMS the customer sends themselves — the no-backend fallback. */
  const smsHref = () => {
    const body = `Hi ${name}, I'd like to request ${summary}. My name is ${form.name || '[name]'}.`
    return `sms:${phone}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(body)}`
  }

  async function submit(e) {
    e.preventDefault()
    if (!ready || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, salon: name, salonPhone: phone,
          service, date: dayKey, time, summary,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          note: form.note.trim(),
        }),
      })
      // A static export has no /api route, so it answers with the HTML page.
      const type = res.headers.get('content-type') || ''
      if (!res.ok || !type.includes('application/json')) throw new Error('no endpoint')
      const result = await res.json()
      if (result.ok !== true) throw new Error('request rejected')
      setState('done')
    } catch {
      setState('offline')
    }
  }

  if (state === 'done') {
    return (
      <Section id="booking" band>
        <div className="card reveal mx-auto max-w-xl text-center" style={{ padding: '48px 32px' }}>
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            <Check size={26} />
          </span>
          <h3 className="display mt-5 text-[26px]">Request sent</h3>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {summary}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {name} will text {form.phone} about your request. Your
            appointment is not booked until they reply.
          </p>
          <button type="button" className="btn btn-ghost mt-7" onClick={() => { setState('idle'); setTime('') }}>
            <ArrowLeft size={15} /> Make another request
          </button>
        </div>
      </Section>
    )
  }

  return (
    <Section id="booking" band>
      <SectionHead
        as={heading}
        title="Request an appointment"
        blurb={`Pick a service and a time. ${name} confirms by text. Walk-ins are welcome too.`}
      />

      <form onSubmit={submit} className="booking-form reveal mx-auto mt-12">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* 1 — service */}
          <fieldset className="border-0 p-6 sm:p-8" style={{ borderBottom: '1px solid var(--line)' }}>
            <legend className="eyebrow mb-4">1 · Service</legend>
            <div className="flex flex-wrap gap-2">
              {services.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { setCategory(i); setService(''); }}
                  aria-pressed={category === i}
                  className={`chip ${category === i ? 'chip-on' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              {(services[category]?.items || []).map((item) => { const label = typeof item === 'string' ? item : item.name; return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setService(label)}
                  aria-pressed={service === label}
                  className={`chip ${service === label ? 'chip-accent' : ''}`}
                >
                  {label}
                </button>
              )})}
            </div>
          </fieldset>

          {/* 2 — day */}
          <fieldset className="border-0 p-6 sm:p-8" style={{ borderBottom: '1px solid var(--line)' }}>
            <legend className="eyebrow mb-4 flex items-center gap-2">
              <Calendar size={13} /> 2 · Day
            </legend>
            <p className="calendar-month">{day?.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} <span>Next 14 days</span></p>
            <div className="booking-days">
              {days.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  disabled={d.closed}
                  onClick={() => setDayKey(d.key)}
                  aria-pressed={dayKey === d.key}
                  title={d.closed ? 'Closed' : undefined}
                  aria-label={`${d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${d.closed ? ', closed' : ''}`}
                  className="shrink-0 rounded-2xl px-3.5 py-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                  style={
                    dayKey === d.key && !d.closed
                      ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                      : { background: 'var(--band)', color: 'var(--ink)', border: '1px solid var(--line)' }
                  }
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                    {d.isToday ? 'Today' : d.weekday}
                  </span>
                  <span className="mt-0.5 block text-[17px] font-semibold tabular-nums">{d.dayNum}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 3 — time */}
          <fieldset className="border-0 p-6 sm:p-8" style={{ borderBottom: '1px solid var(--line)' }}>
            <legend className="eyebrow mb-4 flex items-center gap-2">
              <Clock size={13} /> 3 · Time
            </legend>
            {slots.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    aria-pressed={time === t}
                    className="rounded-xl py-2.5 text-[13.5px] tabular-nums transition-colors"
                    style={
                      time === t
                        ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                        : { background: 'var(--band)', color: 'var(--ink)', border: '1px solid var(--line)' }
                    }
                  >
                    {fmtTime(t)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
                No times left today — pick another day, or call {phoneDisplay} to ask about tonight.
              </p>
            )}
            <p className="mt-4 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              These are opening hours, not confirmed openings. {name} will text you back to confirm.
            </p>
          </fieldset>

          {/* 4 — contact */}
          <fieldset className="border-0 p-6 sm:p-8">
            <legend className="eyebrow mb-4">4 · Your details</legend>
            <div className="booking-summary" aria-live="polite"><span>Your visit</span><strong>{service || 'Choose your service'}</strong><p>{day ? day.date.toLocaleDateString('en-US', {weekday:'long',month:'short',day:'numeric'}) : 'Choose a day'}{time ? ` · ${fmtTime(time)}` : ' · Choose a time'}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                aria-label="Your name" className="input" placeholder="Your name" autoComplete="name" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                aria-label="Mobile number" minLength={10} className="input" placeholder="Mobile number" type="tel" autoComplete="tel" required
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <input
              aria-label="Additional notes" className="input mt-3" placeholder="Anything else? (optional)"
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            {state === 'offline' && (
              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-[13.5px]"
                style={{ background: 'var(--accent-soft)', color: 'var(--ink)' }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span>
                  This preview can't send the request. Text it to {name} directly:{' '}
                  <a className="underline" href={smsHref()}>open a prefilled message</a>, or call{' '}
                  <a className="underline" href={`tel:${phone}`}>{phoneDisplay}</a>.
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={!ready || state === 'sending'}>
                {state === 'sending' ? <Loader2 size={15} className="animate-spin" /> : null}
                {state === 'sending' ? 'Sending…' : 'Request this time'}
              </button>
              <a href={`tel:${phone}`} className="btn btn-ghost">
                <Phone size={15} /> {phoneDisplay}
              </a>
              {summary && ready ? (
                <span className="text-[13px]" style={{ color: 'var(--muted)' }}>{summary}</span>
              ) : null}
            </div>

            {bookingUrl ? (
              <p className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
                Prefer to book instantly?{' '}
                <a className="underline" href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  Use our online booking
                </a>
                .
              </p>
            ) : null}
          </fieldset>
        </div>
      </form>
    </Section>
  )
}
