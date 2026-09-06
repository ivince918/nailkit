import React, { useState } from 'react'
import { Expand, ArrowRight } from 'lucide-react'
import { Section, SectionHead, Lightbox } from '../components/Primitives.jsx'
import { usePage } from '../page.jsx'

/*
 * Masonry, not a bento. Salon photos arrive as phone shots in every shape, and
 * forcing them into fixed cells crops the nails out of the frame. CSS columns
 * let each photo keep its own aspect ratio and balance the column heights on
 * their own; width/height attributes reserve the space so nothing shifts as
 * images load.
 */

/*
 * The gallery only renders with a real set of photos. Below six it would look
 * thin, so the section (and its nav links) drop out entirely until the salon
 * sends enough of its own work.
 */
export const GALLERY_MIN = 6
export const hasGallery = (config) => (config.photos || []).length >= GALLERY_MIN

const TEASER = 6

/** `full` shows every photo (the gallery page, or a single-page site); otherwise six and a link to the rest. */
export function Gallery({ config, full = false }) {
  const { photos = [], name } = config
  const { page, links } = usePage()
  const [open, setOpen] = useState(null)
  if (!hasGallery(config)) return null

  const shown = full ? photos.slice(0, 48) : photos.slice(0, TEASER)
  const rest = photos.length - shown.length

  return (
    <Section id="gallery" band>
      <SectionHead
        as={page === 'gallery' ? 'h1' : 'h2'}
        title="Recent work"
        blurb={full ? `${photos.length} sets done at ${name}.` : `Sets done at ${name}.`}
      />

      <div className="masonry mt-12">
        {shown.map((p, i) => (
          <button
            key={p.src}
            onClick={() => setOpen(i)}
            aria-label={p.alt ? `View photo: ${p.alt}` : `View photo ${i + 1} of ${shown.length}`}
            className="masonry-item reveal reveal-img group"
            style={{ borderRadius: 'var(--radius-sm)', transitionDelay: `${(i % 6) * 60}ms` }}
          >
            <img
              src={p.src}
              srcSet={p.srcSm ? `${p.srcSm} 800w, ${p.src} 1600w` : undefined}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
              width={p.width}
              height={p.height}
              alt={p.alt || `${name} nail work`}
              loading={i < 6 ? 'eager' : 'lazy'}
              decoding="async"
              className="block h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Expand size={14} className="text-black" />
            </span>
          </button>
        ))}
      </div>

      {rest > 0 && (
        <div className="reveal mt-10 text-center">
          <a href={links.gallery} className="btn btn-ghost">
            See all {photos.length} sets <ArrowRight size={15} />
          </a>
        </div>
      )}

      {open !== null && (
        <Lightbox photos={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </Section>
  )
}
