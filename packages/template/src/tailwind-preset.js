/** Shared Tailwind preset — every generated site extends this. */
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        band: 'var(--band)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
        line: 'var(--line)',
      },
      borderRadius: {
        theme: 'var(--radius)',
        'theme-sm': 'var(--radius-sm)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      maxWidth: { shell: '1200px' },
    },
  },
  plugins: [],
}
