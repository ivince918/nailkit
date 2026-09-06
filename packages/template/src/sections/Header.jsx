import React, { useState, useEffect } from 'react'
import { Phone, MapPin, Menu, X, Instagram, Facebook, Star } from 'lucide-react'
import { Masthead } from '../components/Masthead.jsx'

const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Book', href: '#booking' },
  { label: 'Visit Us', href: '#visit' },
]

/** Utility strip above the nav: socials on the left, Google rating + call on the right. */
export function TopBar({ config }) {
  const { social = {}, rating, reviewCount, phoneDisplay, phone, mapsUrl, showRating = true } = config
  return (
    <div className="hidden md:block border-b" style={{ background: 'var(--invert-bg)', borderColor: 'rgba(255,255,255,0.10)' }}>
      <div className="mx-auto flex max-w-shell items-center justify-between px-8 py-2 text-[12px]" style={{ color: 'var(--invert-fg)' }}>
        <div className="flex items-center gap-4 opacity-80">
          {social.instagram && (
            <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-100 opacity-70 transition">
              <Instagram size={15} />
            </a>
          )}
          {social.facebook && (
            <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-100 opacity-70 transition">
              <Facebook size={15} />
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition">
            <MapPin size={14} />
            {config.address?.city}, {config.address?.state}
          </a>
        </div>

        <div className="flex items-center gap-5">
          {rating && showRating ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
              <Star size={13} className="fill-current" style={{ color: '#F4B400' }} />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="opacity-70">on Google ({reviewCount?.toLocaleString()} reviews)</span>
            </a>
          ) : null}
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent)' }}>
            <Phone size={13} /> {phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  )
}

export function Nav({ config }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { name, phone, phoneDisplay, bookingUrl } = config

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const bookHref = bookingUrl || '#booking'

  return (
    <header
      className="sticky top-0 z-[60] transition-all duration-300"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--bg) 88%, transparent)' : 'var(--bg)',
        backdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex max-w-shell items-center justify-between px-5 sm:px-8 py-4">
        <Masthead config={config} className="pr-3" />

        <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[14px] font-medium transition-colors hover:opacity-100 opacity-75"
              style={{ color: 'var(--ink)' }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a href={`tel:${phone}`} className="btn btn-ghost hidden sm:inline-flex !py-2.5 !px-4">
            <Phone size={14} /> <span className="hidden xl:inline">{phoneDisplay}</span><span className="xl:hidden">Call</span>
          </a>
          <a href={bookHref} className="btn btn-primary !py-2.5 !px-5">Book Now</a>
          <button
            className="lg:hidden ml-1 p-2 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
          <nav className="mx-auto max-w-shell px-5 py-3" aria-label="Mobile">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block border-b py-4 text-[16px] font-medium last:border-0"
                style={{ borderColor: 'var(--line)' }}
              >
                {n.label}
              </a>
            ))}
            <a href={`tel:${phone}`} className="btn btn-ghost mt-4 w-full">
              <Phone size={15} /> {phoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
