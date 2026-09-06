/*
 * Six themes. Each is a palette + font pair + shape language, expressed entirely
 * as CSS custom properties so every section adapts without conditional code.
 * The generator assigns one by hashing the Google place ID, so two salons on the
 * same street never get the same look.
 */

export const THEMES = {
  'marble-gold': {
    label: 'Marble & Gold',
    mood: 'Luxury, established, older clientele',
    fonts: {
      display: '"Cormorant Garamond", Georgia, serif',
      body: '"Lato", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Lato:wght@400;700&display=swap',
    },
    vars: {
      '--bg': '#FFFDF8',
      '--surface': '#FFFFFF',
      '--band': '#F7F0E3',
      '--ink': '#1E1810',
      '--muted': '#6E6353',
      '--accent': '#A9853F',
      '--accent-hover': '#8E6E30',
      '--accent-soft': '#F2E7D0',
      '--on-accent': '#FFFFFF',
      '--line': 'rgba(30,24,16,0.10)',
      '--invert-bg': '#1E1810',
      '--invert-fg': '#FFFDF8',
      '--radius': '18px',
      '--radius-sm': '10px',
      '--display-weight': '600',
      '--display-tracking': '-0.015em',
      '--display-transform': 'none',
      '--headline-measure': '15ch',
      '--display-line': '1.02',
    },
  },

  'blush-modern': {
    label: 'Blush & Plum',
    mood: 'Trendy, Instagram-forward, younger clientele',
    fonts: {
      display: '"Playfair Display", Georgia, serif',
      body: '"Poppins", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap',
    },
    vars: {
      '--bg': '#FFFAFB',
      '--surface': '#FFFFFF',
      '--band': '#FBEEF1',
      '--ink': '#2E1B24',
      '--muted': '#7B6470',
      '--accent': '#B8546F',
      '--accent-hover': '#9C4159',
      '--accent-soft': '#F8E1E7',
      '--on-accent': '#FFFFFF',
      '--line': 'rgba(46,27,36,0.09)',
      '--invert-bg': '#2E1B24',
      '--invert-fg': '#FFFAFB',
      '--radius': '26px',
      '--radius-sm': '16px',
      '--display-weight': '600',
      '--display-tracking': '-0.02em',
      '--display-transform': 'none',
      '--headline-measure': '14ch',
      '--display-line': '1.06',
    },
  },

  'sage-minimal': {
    label: 'Sage & Stone',
    mood: 'Calm, clean, spa-like, health-conscious',
    fonts: {
      display: '"Montserrat", system-ui, sans-serif',
      body: '"Lato", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Lato:wght@400;700&display=swap',
    },
    vars: {
      '--bg': '#FBFBF8',
      '--surface': '#FFFFFF',
      '--band': '#EFF1EA',
      '--ink': '#20261D',
      '--muted': '#5F6A58',
      '--accent': '#5C7A57',
      '--accent-hover': '#4A6546',
      '--accent-soft': '#E2E9DE',
      '--on-accent': '#FFFFFF',
      '--line': 'rgba(32,38,29,0.10)',
      '--invert-bg': '#20261D',
      '--invert-fg': '#FBFBF8',
      '--radius': '14px',
      '--radius-sm': '8px',
      '--display-weight': '600',
      '--display-tracking': '-0.03em',
      '--display-transform': 'none',
      '--headline-measure': '15ch',
      '--display-line': '1.05',
    },
  },

  'midnight-neon': {
    label: 'Midnight & Lilac',
    mood: 'Bold, nail-art heavy, downtown studios',
    dark: true,
    fonts: {
      display: '"Bebas Neue", Impact, sans-serif',
      body: '"Poppins", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600&display=swap',
    },
    vars: {
      '--bg': '#0C0B10',
      '--surface': '#16141D',
      '--band': '#131119',
      '--ink': '#F5F2FA',
      '--muted': '#A49CB4',
      '--accent': '#B98CFF',
      '--accent-hover': '#CBA8FF',
      '--accent-soft': 'rgba(185,140,255,0.14)',
      '--on-accent': '#160F24',
      '--line': 'rgba(255,255,255,0.10)',
      '--invert-bg': '#16141D',
      '--invert-fg': '#F5F2FA',
      '--radius': '20px',
      '--radius-sm': '12px',
      '--display-weight': '400',
      '--display-tracking': '0.012em',
      '--display-transform': 'uppercase',
      '--headline-measure': '21ch',
      '--display-line': '0.92',
    },
  },

  'terracotta-warm': {
    label: 'Terracotta & Sand',
    mood: 'Warm, neighborhood, family-run',
    fonts: {
      display: '"Fraunces", Georgia, serif',
      body: '"Lato", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Lato:wght@400;700&display=swap',
    },
    vars: {
      '--bg': '#FDF7F0',
      '--surface': '#FFFFFF',
      '--band': '#F6E9DC',
      '--ink': '#33211A',
      '--muted': '#7A6357',
      '--accent': '#B85C36',
      '--accent-hover': '#9C4A28',
      '--accent-soft': '#F7DFD1',
      '--on-accent': '#FFFFFF',
      '--line': 'rgba(51,33,26,0.10)',
      '--invert-bg': '#33211A',
      '--invert-fg': '#FDF7F0',
      '--radius': '22px',
      '--radius-sm': '14px',
      '--display-weight': '600',
      '--display-tracking': '-0.025em',
      '--display-transform': 'none',
      '--headline-measure': '14ch',
      '--display-line': '1.04',
    },
  },

  'pearl-clean': {
    label: 'Pearl & Teal',
    mood: 'Crisp, modern, medical-grade / clinical trust',
    fonts: {
      display: '"Bodoni Moda", Didot, Georgia, serif',
      body: '"Inter", system-ui, sans-serif',
      href: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Inter:wght@400;500;600&display=swap',
    },
    vars: {
      '--bg': '#FFFFFF',
      '--surface': '#FFFFFF',
      '--band': '#F1F5F5',
      '--ink': '#14181C',
      '--muted': '#5B686E',
      '--accent': '#1F6F6B',
      '--accent-hover': '#165653',
      '--accent-soft': '#DDECEB',
      '--on-accent': '#FFFFFF',
      '--line': 'rgba(20,24,28,0.09)',
      '--invert-bg': '#14181C',
      '--invert-fg': '#FFFFFF',
      '--radius': '16px',
      '--radius-sm': '10px',
      '--display-weight': '600',
      '--display-tracking': '-0.01em',
      '--display-transform': 'none',
      '--headline-measure': '15ch',
      '--display-line': '1.05',
    },
  },
}

export const THEME_IDS = Object.keys(THEMES)

/** Stable string hash — same place ID always yields the same theme. */
export function hashString(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function pickTheme(seed) {
  return THEME_IDS[hashString(String(seed)) % THEME_IDS.length]
}

/** Turn a theme id into an inline style object of CSS vars for the root element. */
export function themeStyle(id) {
  const t = THEMES[id] || THEMES['pearl-clean']
  return { ...t.vars, '--font-display': t.fonts.display, '--font-body': t.fonts.body }
}
