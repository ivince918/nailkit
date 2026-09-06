import React, { useState } from 'react'
import { Expand } from 'lucide-react'
import { Section, SectionHead, Lightbox } from '../components/Primitives.jsx'

/*
 * Bento grid. The span pattern tiles perfectly in groups of 8 across 4 columns,
 * and `grid-flow-dense` backfills the remainder so a salon with 5 photos or 11
 * still gets a solid block with no holes.
 */
const SPANS = [
  'md:col-span-2 md:row-span-2',
  '',
  '',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-2 md:row-span-2',
  '',
  '',
]

/* Exactly six photos is the common case for a new salon; the eight-pattern
   leaves one hole there, and this 4x3 arrangement tiles it with none. */
const SIX_SPANS = [
  'md:col-span-2 md:row-span-2',
  '',
  '',
  'md:col-span-2 md:row-span-2',
  '',
  '',
]

/*
 * The gallery only renders with a real set of photos. Below six it would be a
 * bento with holes, so the section (and its nav links) drop out entirely until
 * the salon sends enough of its own work.
 */
export const GALLERY_MIN = 6
export const hasGallery = (config) => (config.photos || []).length >= GALLERY_MIN

export function Gallery({ config }) {
  const { photos = [], name } = config
  const [open, setOpen] = useState(null)
  if (!hasGallery(config)) return null

  const shown = photos.slice(0, 12)

  return (
    <Section id="gallery" band>
      <SectionHead
        title="Recent work"
        blurb={`A look at what our team has been doing at ${name}.`}
      />

      <div className="mt-14 grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[180px] md:grid-cols-4 md:gap-4">
        {shown.map((p, i) => (
          <button
            key={p.src}
            onClick={() => setOpen(i)}
            aria-label={`View photo ${i + 1} of ${shown.length}`}
            className={`reveal reveal-img group relative overflow-hidden ${shown.length === 6 ? SIX_SPANS[i] : SPANS[i % SPANS.length]}`}
            style={{ borderRadius: 'var(--radius-sm)', transitionDelay: `${(i % 8) * 60}ms` }}
          >
            <img
              src={p.src}
              srcSet={p.srcSm ? `${p.srcSm} 800w, ${p.src} 1600w` : undefined}
              sizes="(max-width: 768px) 50vw, 25vw"
              alt={p.alt || `${name} nail work`}
              loading={i < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
            <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Expand size={14} className="text-black" />
            </span>
          </button>
        ))}
      </div>

      {open !== null && (
        <Lightbox photos={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </Section>
  )
}
