import React from 'react'
import { Section, SectionHead } from '../components/Primitives.jsx'
import { Icon } from '../components/icons.jsx'

/** "Welcome to {name}" — image left, copy right. */
export function Story({ config }) {
  const { story = {}, photos = [], name } = config
  const img = photos[1] || photos[0]

  return (
    <Section id="about">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {img && (
          <div className="reveal reveal-img overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            <img
              src={img.src}
              srcSet={img.srcSm ? `${img.srcSm} 800w, ${img.src} 1600w` : undefined}
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt={img.alt || `Inside ${name}`}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.04]"
            />
          </div>
        )}

        <div>
          <p className="eyebrow reveal">Our Story</p>
          <h2 className="display reveal mt-3 text-[clamp(30px,4.6vw,50px)]" style={{ transitionDelay: '60ms' }}>
            {story.title || `Welcome to ${name}`}
          </h2>
          {(story.body || []).map((p, i) => (
            <p
              key={i}
              className="reveal mt-5 text-[16px] leading-[1.75]"
              style={{ color: 'var(--muted)', transitionDelay: `${120 + i * 60}ms` }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </Section>
  )
}

/** Icon cards. Seeded by the generator from what reviewers actually praise. */
export function WhyUs({ config }) {
  const { why = [], name } = config
  if (!why.length) return null

  return (
    <Section band>
      <SectionHead
        eyebrow="Why Choose Us"
        title={`What makes ${name} different`}
        blurb="The things our guests mention again and again."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {why.map((w, i) => (
          <div
            key={i}
            className="card card-hover reveal p-7"
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Icon name={w.icon} size={19} />
            </div>
            <h3 className="mt-5 text-[17px] font-semibold">{w.title}</h3>
            <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {w.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}
