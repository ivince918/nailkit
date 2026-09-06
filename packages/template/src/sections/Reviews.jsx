import React from 'react'
import { Quote, ExternalLink } from 'lucide-react'
import { Section, SectionHead, Stars } from '../components/Primitives.jsx'

/*
 * Real Google reviews. Google's Places policy requires these stay attributed to
 * Google and link back to the listing, so the attribution line is not optional
 * decoration — don't strip it when customizing a site.
 */
export function Reviews({ config }) {
  const { reviews = [], rating, reviewCount, mapsUrl, showRating = true } = config
  if (!reviews.length) return null

  // Show 6 or 3 — five cards would leave a ragged last row in the 3-col grid.
  const shown = reviews.slice(0, reviews.length >= 6 ? 6 : 3)

  return (
    <Section id="reviews">
      <SectionHead
        eyebrow="Testimonials"
        title="What our guests say"
        blurb={rating && showRating ? `Rated ${rating.toFixed(1)} out of 5 across ${reviewCount?.toLocaleString()} Google reviews.` : undefined}
      />

      <div className="no-bar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {shown.map((r, i) => (
          <figure
            key={i}
            className="card card-hover reveal flex min-w-[85%] snap-center flex-col p-7 sm:min-w-[420px] md:min-w-0"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <Quote size={22} style={{ color: 'var(--accent)' }} className="opacity-40" />
            <blockquote className="mt-4 flex-1 text-[15px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
              {r.text}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
              {r.avatar ? (
                <img src={r.avatar} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {r.author?.[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{r.author}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars rating={r.rating} size={11} />
                  {r.time ? (
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{r.time}</span>
                  ) : null}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="reveal mt-8 text-center text-[12.5px]" style={{ color: 'var(--muted)' }}>
        Reviews sourced from Google.{' '}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          Read all reviews on Google <ExternalLink size={11} />
        </a>
      </p>
    </Section>
  )
}
