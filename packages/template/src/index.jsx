import React, { useEffect } from 'react'
import { SalonIntro, useSalonIntro } from './components/SalonIntro.jsx'
import { useScrollReveal } from './hooks/useScrollReveal.js'
import { themeStyle, THEMES } from './themes.js'
import { ScrollProgress } from './components/Primitives.jsx'
import { TopBar, Nav } from './sections/Header.jsx'
import { Hero } from './sections/Hero.jsx'
import { Story, WhyUs } from './sections/Story.jsx'
import { Services } from './sections/Services.jsx'
import { Gallery } from './sections/Gallery.jsx'
import { Reviews } from './sections/Reviews.jsx'
import { Booking } from './sections/Booking.jsx'
import { Visit, BookCTA } from './sections/Visit.jsx'
import { Footer } from './sections/Footer.jsx'
import { PageProvider, linksFor } from './page.jsx'

export { THEMES, THEME_IDS, pickTheme, hashString, themeStyle } from './themes.js'
export { buildJsonLd } from './seo.js'
export { linksFor } from './page.jsx'

/**
 * The entire site. `page` picks the shell: 'home' (default), 'gallery', or
 * 'book'. Every generated site's main.jsx is: render(<SalonSite config={config} />)
 * and a site that opts into real pages adds one entry per page.
 */
export default function SalonSite({ config, page = 'home' }) {
  useScrollReveal()
  const [introPhase, skipIntro] = useSalonIntro(config.slug || config.name, page === 'home')

  const theme = THEMES[config.theme] ? config.theme : 'pearl-clean'
  const pages = config.pages || {}

  useEffect(() => {
    // Static index.html already carries these; this keeps dev/preview honest
    // and covers configs edited by hand after scaffolding.
    const t = THEMES[theme]
    if (t?.fonts?.href && !document.querySelector(`link[href="${t.fonts.href}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = t.fonts.href
      document.head.appendChild(link)
    }
    document.documentElement.style.background = t.vars['--bg']
  }, [theme])

  const links = linksFor(config, page)

  return (
    <PageProvider config={config} page={page}>
    <div style={themeStyle(theme)} className="font-body salon-site" data-intro={introPhase}>
      {introPhase !== 'done' && <SalonIntro config={config} phase={introPhase} onSkip={skipIntro} />}
      <div className="salon-content" inert={introPhase !== 'done' ? '' : undefined}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <ScrollProgress />
      <TopBar config={config} />
      <Nav config={config} />
      <main id="main-content">
        {page === 'gallery' && (
          <>
            <Gallery config={config} full />
            <BookCTA config={config} />
          </>
        )}
        {page === 'book' && (
          <>
            <Booking config={config} heading="h1" />
            <Visit config={config} />
          </>
        )}
        {page === 'home' && (
          <>
            <Hero config={config} />
            <Story config={config} />
            <WhyUs config={config} />
            <Services config={config} />
            <Gallery config={config} full={!pages.gallery} />
            <Reviews config={config} />
            {!pages.book && <Booking config={config} />}
            <Visit config={config} />
            <BookCTA config={config} />
          </>
        )}
      </main>
      <Footer config={config} />
      {page !== 'book' && (
        <div className="mobile-booking-bar">
          <a href={`tel:${config.phone}`}>Call the salon</a>
          <a className="btn btn-primary" href={links.book}>Request a time <span aria-hidden="true">↗</span></a>
        </div>
      )}
      </div>
    </div>
    </PageProvider>
  )
}
