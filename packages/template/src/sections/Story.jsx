import React from 'react'
import { Section, SectionHead } from '../components/Primitives.jsx'

/** "Welcome to {name}" — image left, copy right. */
export function Story({ config }) {
  const { story = {}, photos = [], name } = config
  // A portrait shot fills the 4:5 frame without cropping; skip the gallery lead so the two sections differ.
  const img = photos.find((p, i) => i > 0 && p.height > p.width) || photos[1] || photos[0]

  return (
    <Section id="about">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {!img && config.placeholderImages && <div className="blank-photo reveal" style={{aspectRatio:'4/5'}}><span>THE SALON</span><p>Image placeholder</p></div>}
        {img && (
          <div className="reveal reveal-img overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            <img
              src={img.src}
              srcSet={img.srcSm ? `${img.srcSm} ${img.smallWidth || Math.min(img.width || 800,800)}w, ${img.src} ${img.width || 1600}w` : undefined}
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt={img.alt || `Inside ${name}`}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.04]"
            />
          </div>
        )}

        <div>
          <h2 className="display reveal text-[clamp(30px,4.6vw,50px)]">
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

/**
 * Editorial list seeded by the generator from what reviewers actually praise.
 * The heading sits in a sticky left column on wide screens so the list reads
 * like a magazine sidebar rather than a grid of icon cards.
 */
export function WhyUs({ config }) {
  const { why = [] } = config
  if (!why.length) return null

  return (
    <Section band>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <SectionHead
            center={false}
            title="Why guests come back"
            blurb="The things reviewers mention most."
          />
        </div>

        <ol className="why-list lg:col-span-8">
          {why.map((w, i) => (
            <li key={i} className="why-item reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <h3 className="display text-[22px] leading-tight">{w.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {w.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
