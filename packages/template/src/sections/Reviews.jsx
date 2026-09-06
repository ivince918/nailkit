import React from 'react'
import { ExternalLink } from 'lucide-react'
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
            <blockquote className="flex-1 text-[15px] leading-[1.7]" style={{ color: 'var(--ink)' }}>
              {r.text}
            </blockquote>
            <figcaption className="mt-6 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold">{r.author}</span>
                {r.time ? <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{r.time}</span> : null}
              </span>
              <Stars rating={r.rating} size={11} className="shrink-0" />
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
