import React, { useState } from 'react'
import { ArrowRight, Phone, Check } from 'lucide-react'
import { Section, SectionHead } from '../components/Primitives.jsx'
import { Icon } from '../components/icons.jsx'

/*
 * Category grid + a menu panel that swaps below it. Heavenly's layout uses
 * "View menu" tiles; expanding in place would jump the grid, so the selected
 * category renders into a fixed panel underneath instead.
 */
export function Services({ config }) {
  const { services = [], showPrices = false, phone, bookingUrl } = config
  const [active, setActive] = useState(0)
  if (!services.length) return null

  const current = services[active]

  return (
    <Section id="services">
      <SectionHead
        eyebrow="Our Services"
        title="From a quick classic to full custom art"
        blurb="Tap a category to see the full menu."
      />

      <div className="mt-14 flex flex-wrap justify-center gap-4">
        {services.map((s, i) => {
          const on = i === active
          return (
            <button
              key={s.name}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`card card-hover reveal group w-full p-6 text-left sm:w-[calc(50%-8px)] ${services.length === 5 ? 'lg:w-[calc(20%-13px)]' : 'lg:w-[calc(25%-12px)]'}`}
              style={{
                transitionDelay: `${i * 55}ms`,
                borderColor: on ? 'var(--accent)' : 'var(--line)',
                background: on ? 'var(--accent-soft)' : 'var(--surface)',
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: on ? 'var(--accent)' : 'var(--accent-soft)',
                  color: on ? 'var(--on-accent)' : 'var(--accent)',
                }}
              >
                <Icon name={s.icon} size={18} />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold leading-snug">{s.name}</h3>
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium"
                style={{ color: 'var(--accent)' }}
              >
                {s.items.length} options
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          )
        })}
      </div>

      <div className="card reveal mt-6 overflow-hidden p-7 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Menu</p>
            <h3 className="display mt-2 text-[26px] sm:text-[32px]">{current.name}</h3>
          </div>
          <a href={bookingUrl || '#booking'} className="btn btn-primary !py-3 !px-5 text-[13.5px]">
            {bookingUrl ? 'Book this' : 'Request a time'}
          </a>
        </div>

        <div className="hairline my-7" />

        <ul key={current.name} className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
          {current.items.map((item, i) => {
            const label = typeof item === 'string' ? item : item.name
            const price = typeof item === 'string' ? null : item.price
            return (
              <li
                key={label}
                className="fade-up flex items-baseline gap-3 border-b py-3.5 last:border-0 sm:[&:nth-last-child(2)]:border-0"
                style={{ borderColor: 'var(--line)', animationDelay: `${i * 35}ms`, animationDuration: '520ms' }}
              >
                <Check size={14} className="shrink-0 translate-y-0.5" style={{ color: 'var(--accent)' }} />
                <a className="service-book-link text-[15px]" href="#booking" onClick={() => window.dispatchEvent(new CustomEvent('salon:select-service', { detail: label }))}>{label}<ArrowRight size={13} aria-hidden="true" /></a>
                <span className="flex-1 border-b border-dotted opacity-30" style={{ borderColor: 'var(--muted)' }} />
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: showPrices && price ? 'var(--ink)' : 'var(--muted)' }}>
                  {showPrices && price ? price : 'Call'}
                </span>
              </li>
            )
          })}
        </ul>

        {!showPrices && (
          <p className="mt-6 text-[13px]" style={{ color: 'var(--muted)' }}>
            Pricing varies by length, shape, and design — call us for an exact quote.
          </p>
        )}
      </div>
    </Section>
  )
}
