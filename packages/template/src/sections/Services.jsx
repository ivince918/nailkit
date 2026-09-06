import React, { useState } from 'react'
import { ArrowRight, Phone, Check } from 'lucide-react'
import { Section, SectionHead } from '../components/Primitives.jsx'
import { usePage } from '../page.jsx'

/*
 * Category chips + a menu panel that swaps below them. The chips are the same
 * control the booking form uses, so picking a category here and picking one
 * there feel like one system. Expanding in place would jump the layout, so the
 * selected category renders into a fixed panel underneath instead.
 */
export function Services({ config }) {
  const { services = [], showPrices = false } = config
  const { links } = usePage()
  const [active, setActive] = useState(0)
  if (!services.length) return null

  const current = services[active]

  return (
    <Section id="services">
      <SectionHead
        title="From a quick classic to full custom art"
        blurb="Tap a category to see the full menu."
      />

      <div className="reveal mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Service categories">
        {services.map((s, i) => {
          const on = i === active
          return (
            <button
              key={s.name}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className={`chip ${on ? 'chip-on' : ''}`}
            >
              {s.name}
              <span className="chip-count">{s.items.length}</span>
            </button>
          )
        })}
      </div>

      <div className="card reveal mt-6 overflow-hidden p-7 sm:p-10" role="tabpanel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="display text-[26px] sm:text-[32px]">{current.name}</h3>
          <a href={links.book} className="btn btn-primary !py-3 !px-5 text-[13.5px]">
            {links.bookExternal ? 'Book online' : 'Request a time'}
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
                <a className="service-book-link text-[15px]" href={links.bookService(label)} onClick={() => window.dispatchEvent(new CustomEvent('salon:select-service', { detail: label }))}>{label}<ArrowRight size={13} aria-hidden="true" /></a>
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
            Prices depend on length, shape, and design. Call for a quote.
          </p>
        )}
      </div>
    </Section>
  )
}
