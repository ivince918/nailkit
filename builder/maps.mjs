import puppeteer from 'puppeteer'

export function mapsUrl(value) {
  const u = new URL(value)
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !(['www.google.com','google.com','maps.google.com','maps.app.goo.gl','goo.gl'].includes(u.hostname)) || (u.hostname.endsWith('google.com') && !u.pathname.startsWith('/maps') && u.hostname !== 'maps.google.com')) throw new Error('Paste a Google Maps place link (https://www.google.com/maps/… or maps.app.goo.gl).')
  u.searchParams.set('hl','en'); return u.href
}
export function photoUrl(value) {
  const u = new URL(value)
  if (u.protocol !== 'https:' || u.port || u.username || u.password || !/^(lh\d+\.googleusercontent\.com|lh\d+\.ggpht\.com)$/.test(u.hostname) || !/^\/(p|gps-cs-s|gps-proxy)\//.test(u.pathname)) throw new Error('This is not a Google Maps listing photo URL.')
  return u.href
}
export function parseHours(rows) {
  const hours = {}, warnings = []
  for (const row of rows) {
    const key = row.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i)?.[1].slice(0,3).toLowerCase()
    if (!key) continue
    if (/might differ|holiday|24 hours/i.test(row)) { warnings.push(`${key}: confirm special or 24-hour hours manually.`); continue }
    if (/closed/i.test(row)) { hours[key]='closed'; continue }
    const matches = [...row.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi)]
    if (matches.length !== 2) { warnings.push(`${key}: hours could not be read as a single opening period.`); continue }
    const time = m => `${String(Number(m[1])%12 + (/pm/i.test(m[3])?12:0)).padStart(2,'0')}:${m[2]||'00'}`
    hours[key]=matches.map(time).join('-')
  }
  return {hours,warnings}
}

/** Reads the rendered public listing. No private endpoints, account, API key, or CAPTCHA bypass. */
export async function importMaps(input, progress = () => {}) {
  const url=mapsUrl(input)
  progress('Opening Google Maps…')
  const browser=await puppeteer.launch({headless:true})
  try {
    const page=await browser.newPage()
    await page.setViewport({width:1440,height:1000})
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000})
    await page.waitForFunction(()=>document.querySelector('h1')?.textContent?.trim(),{timeout:20000}).catch(()=>{})
    if (/consent.google|\/sorry\//.test(page.url())) throw new Error('Google requires consent or verification. Open the listing yourself and use the editable fields and photo upload below; the importer will not bypass this screen.')
    await page.waitForSelector('[data-item-id="address"]',{timeout:12000}).catch(()=>{})
    progress('Reading contact details and hours…')
    const listing=await page.evaluate(()=>{
      const label=s=>document.querySelector(s)?.getAttribute('aria-label')||''
      return {name:document.querySelector('h1')?.textContent?.trim()||'',address:label('[data-item-id="address"]').replace(/^Address:\s*/, '').trim(),phone:label('[data-item-id^="phone:"]').replace(/^Phone:\s*/, '').trim(),website:document.querySelector('a[data-item-id="authority"]')?.href||'',mapsUrl:location.href,limited:document.body.innerText.includes('limited view'),rating:Number(document.querySelector('[role="img"][aria-label*="stars"]')?.getAttribute('aria-label')?.match(/[\d.]+/)?.[0])||null}
    })
    if(!listing.name || !listing.address) throw new Error('Google did not expose a complete place listing. Use the full Share link for one business, or fill in the fields manually.')
    await page.evaluate(()=>document.querySelector('[aria-label="Show open hours for the week"]')?.parentElement?.click())
    await new Promise(r=>setTimeout(r,650))
    const rows=await page.evaluate(()=>[...document.querySelectorAll('button[aria-label*="Copy open hours"]')].map(x=>x.getAttribute('aria-label')))
    const parsed=parseHours(rows)
    const warnings=[...parsed.warnings]
    if(listing.limited) warnings.push('Google is showing a limited public view. Some photos and details may be unavailable.')
    if(Object.keys(parsed.hours).length<7) warnings.push('Weekly hours are incomplete. Missing days stay unknown; fill them in before using booking.')
    if(!listing.phone) warnings.push('Phone number was not available.')
    const coords=listing.mapsUrl.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/)
    const readPhotos=()=>page.evaluate(()=>[...document.querySelectorAll('img')].map(x=>({url:x.currentSrc||x.src,alt:x.alt})).filter(x=>/^https:\/\/lh\d+\.(googleusercontent|ggpht)\.com\/(p|gps-cs-s|gps-proxy)\//.test(x.url)))
    let photos=await readPhotos()
    progress('Collecting available listing photos…')
    const cover=await page.$('button[aria-label^="Photo of "]')
    let author=null,viewerUrl=null
    if(cover){await cover.click();await new Promise(r=>setTimeout(r,1400));photos.push(...await readPhotos());viewerUrl=page.url();author=await page.evaluate(()=>{const lines=document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean);const i=lines.findIndex(s=>/^Photo - /.test(s));return i>0?lines[i-1]:null})}
    // Collect only visible photo thumbnails as the gallery scrolls; bounded to 12 images.
    for(let i=0;i<3;i++){
      await page.evaluate(()=>{const el=[...document.querySelectorAll('[role="main"], [role="feed"]')].find(x=>x.scrollHeight>x.clientHeight+200);if(el)el.scrollTop+=600})
      await new Promise(r=>setTimeout(r,350));photos.push(...await readPhotos())
    }
    const seen=new Set()
    photos=photos.filter(p=>{const id=p.url.split('=')[0];if(seen.has(id))return false;seen.add(id);return true}).slice(0,12).map(p=>({...p,url:photoUrl(p.url.replace(/=w\d+.*$/,'=w2400-h2400-k-no')),sourceUrl:p.url.split('=')[0]===photos[0]?.url.split('=')[0]&&viewerUrl?viewerUrl:listing.mapsUrl,attribution:p.url.split('=')[0]===photos[0]?.url.split('=')[0]&&author?author:'Google Maps'}))
    if(photos.length<6) warnings.push(`Only ${photos.length} listing photo${photos.length===1?' was':'s were'} available. Empty slots remain blank; you can upload more.`)
    return {listing:{name:listing.name,address:listing.address,phone:listing.phone,website:listing.website,mapsUrl:listing.mapsUrl,rating:listing.rating,hours:parsed.hours,lat:coords?Number(coords[1]):null,lng:coords?Number(coords[2]):null,utcOffsetMinutes:null},photos,warnings,importedAt:new Date().toISOString()}
  } finally {await browser.close()}
}
