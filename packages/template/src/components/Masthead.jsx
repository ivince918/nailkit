import React from 'react'
import { usePage } from '../page.jsx'

/*
 * Generated wordmark. Salons at this size rarely have a usable logo file — and
 * a prospect who opens their site and sees a real mark takes the pitch more
 * seriously than one who sees their name set in the body font.
 *
 * The monogram shape is chosen per theme so it reads as part of the same design
 * decision as the palette and the typeface, not a badge dropped on top.
 */

const GENERIC = new Set([
  'nail', 'nails', 'nailz', 'spa', 'salon', 'studio', 'bar', 'lounge', 'beauty',
  'the', 'and', '&', 'of', 'by', 'day', 'care',
  'co', 'inc', 'llc', 'group', 'company',
])

/** "Heavenly Nail Spa" -> "H" · "Sunny Day Nails" -> "S" · "J & K Nails" -> "JK" */
export function initialsFor(name = '') {
  const words = name.split(/\s+/).filter(Boolean)
  const meaningful = words.filter((w) => !GENERIC.has(w.toLowerCase().replace(/[^a-z&]/gi, '')))
  const source = meaningful.length ? meaningful : words
  return source.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'N'
}

/*
 * One shape per theme. Each is drawn on a 48x48 grid: `frame` is the container
 * stroke, `inner` any secondary detail. Letters are centered separately so they
 * inherit the theme's display face.
 */
function Frame({ theme }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.25 }
  switch (theme) {
    case 'marble-gold': // double hairline ring — classic boutique
      return (
        <>
          <circle cx="24" cy="24" r="22.2" {...stroke} strokeWidth={0.9} />
          <circle cx="24" cy="24" r="19.4" {...stroke} strokeWidth={0.5} opacity={0.55} />
        </>
      )
    case 'blush-modern': // squircle, soft and contemporary
      return <rect x="2" y="2" width="44" height="44" rx="15" {...stroke} />
    case 'sage-minimal': // bare square, nothing extra
      return <rect x="2.5" y="2.5" width="43" height="43" rx="2" {...stroke} strokeWidth={1} />
    case 'midnight-neon': // hexagon — sharp, club-poster energy
      return <polygon points="24,1.6 45,13 45,35 24,46.4 3,35 3,13" {...stroke} strokeWidth={1.4} />
    case 'terracotta-warm': // arch, like a shopfront doorway
      return <path d="M4 46V22a20 20 0 0 1 40 0v24" {...stroke} strokeLinecap="round" />
    default: // pearl-clean — circle with a fine baseline rule
      return (
        <>
          <circle cx="24" cy="24" r="22.2" {...stroke} strokeWidth={0.9} />
          <line x1="15" y1="38.5" x2="33" y2="38.5" {...stroke} strokeWidth={0.7} opacity={0.6} />
        </>
      )
  }
}

export function Monogram({ config, size = 38, className = '' }) {
  const letters = initialsFor(config.name)
  const dy = config.theme === 'terracotta-warm' ? 2.5 : 0.5

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ color: 'var(--accent)' }}
      role="img"
      aria-label={`${config.name} monogram`}
    >
      <Frame theme={config.theme} />
      <text
        x="24"
        y={24 + dy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--display-weight)',
          fontSize: letters.length > 1 ? 18 : 22.5,
          letterSpacing: letters.length > 1 ? '0.02em' : '0',
        }}
      >
        {letters}
      </text>
    </svg>
  )
}

/**
 * The full lockup. `nav` sits inline in the header; `stacked` centers the mark
 * over the name with a locality rule beneath, for the footer.
 */
export function Masthead({ config, variant = 'nav', className = '' }) {
  const { name, address } = config
  const { links } = usePage()
  const locality = [address?.city, address?.state].filter(Boolean).join(', ')

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <Monogram config={config} size={52} />
        <span className="display mt-3 text-[26px] leading-none">{name}</span>
        <span
          className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: 'var(--muted)' }}
        >
          Nail Studio{locality ? ` · ${locality}` : ''}
        </span>
      </div>
    )
  }

  return (
    <a href={links.home} className={`flex min-w-0 items-center gap-2.5 ${className}`} aria-label={`${name} — home`}>
      <Monogram config={config} size={34} />
      <span className="display truncate text-[19px] leading-none sm:text-[22px]">{name}</span>
    </a>
  )
}
