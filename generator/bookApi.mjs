/* The Vercel serverless function scaffolded into every site as api/book.js. */
export const bookApiSource = `import config from '../salon.config.json' with { type: 'json' }

/*
 * Booking request -> SMS to the salon.
 *
 * SECURITY: the destination number is read from this site's own committed
 * config, never from the request body. If the caller could name the recipient,
 * this endpoint would be a free, open SMS relay for anyone who found the URL.
 *
 * Env (set once on the Vercel project, shared by every salon site):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 */

const MAX = { name: 80, phone: 32, service: 80, note: 400 }
const clean = (v, max) => String(v ?? '').replace(/[\\u0000-\\u001F\\u007F]/g, '').trim().slice(0, max)

// Best-effort throttle. Serverless instances are recycled, so this stops casual
// hammering only — put Upstash in front of it before a real launch.
const hits = new Map()
function throttled(ip, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const rec = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  rec.push(now)
  hits.set(ip, rec)
  return rec.length > limit
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (throttled(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please call us instead.' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const customerName = clean(body.customerName, MAX.name)
  const customerPhone = clean(body.customerPhone, MAX.phone)
  const service = clean(body.service, MAX.service)
  const note = clean(body.note, MAX.note)
  const date = clean(body.date, 10)
  const time = clean(body.time, 5)

  if (!customerName || !customerPhone || !service || !date || !time) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' })
  }
  if (!/^[0-9+()\\s.-]{7,}$/.test(customerPhone)) {
    return res.status(400).json({ ok: false, error: 'That phone number does not look right' })
  }

  const to = config.phone // <- from config, never from the request
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env
  if (!sid || !token || !from || !to) {
    console.error('book: SMS not configured', { hasSid: !!sid, hasFrom: !!from, hasTo: !!to })
    return res.status(503).json({ ok: false, error: 'Booking is not switched on yet' })
  }

  const text =
    \`New booking request — \${config.name}\\n\` +
    \`\${service}\\n\${date} at \${time}\\n\` +
    \`\${customerName} · \${customerPhone}\` +
    (note ? \`\\nNote: \${note}\` : '')

  const twilio = await fetch(\`https://api.twilio.com/2010-04-01/Accounts/\${sid}/Messages.json\`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(\`\${sid}:\${token}\`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: text }),
  })

  if (!twilio.ok) {
    const detail = await twilio.text()
    console.error('book: twilio failed', twilio.status, detail)
    return res.status(502).json({ ok: false, error: 'Could not send the request. Please call us.' })
  }

  return res.status(200).json({ ok: true })
}
`
