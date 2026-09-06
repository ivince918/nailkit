import React, { createContext, useContext } from 'react'

/*
 * Which page of the site is rendering, and where every link should point from
 * it. Sites are single-page by default (every link is an anchor). A config can
 * opt into real pages with `"pages": { "gallery": "/gallery/", "book": "/book/" }`
 * and ship a matching index.html per page; the links below follow.
 */
const PageContext = createContext({ page: 'home', links: {} })

export function linksFor(config, page = 'home') {
  const base = page === 'home' ? '' : '/'
  const pages = config.pages || {}
  const book = config.bookingUrl || pages.book || `${base}#booking`
  return {
    home: page === 'home' ? '#top' : '/',
    services: `${base}#services`,
    reviews: `${base}#reviews`,
    visit: `${base}#visit`,
    gallery: pages.gallery || `${base}#gallery`,
    book,
    bookExternal: !!config.bookingUrl,
    /** Deep link that preselects one service on the request form. */
    bookService: (label) =>
      config.bookingUrl ? config.bookingUrl
      : pages.book ? `${pages.book}?service=${encodeURIComponent(label)}`
      : `${base}#booking`,
  }
}

export function PageProvider({ config, page, children }) {
  return <PageContext.Provider value={{ page, links: linksFor(config, page) }}>{children}</PageContext.Provider>
}

export const usePage = () => useContext(PageContext)
