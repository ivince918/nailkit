import { useState, useEffect } from 'react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "19:00" -> "7:00 PM" */
export function fmtTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/*
 * Open/closed status in the SALON's timezone, not the visitor's — a Palo Alto
 * salon must read "Closed" to someone browsing from New York at 10pm ET.
 * utcOffsetMinutes comes straight from the Places API.
 */
export function useOpenNow(hours = [], utcOffsetMinutes = null) {
  const compute = () => {
    if (!hours.length) return { open: null, label: '', todayIdx: new Date().getDay() }

    const now = new Date()
    const local =
      utcOffsetMinutes === null
        ? now
        : new Date(now.getTime() + now.getTimezoneOffset() * 60000 + utcOffsetMinutes * 60000)

    const todayIdx = local.getDay()
    const mins = local.getHours() * 60 + local.getMinutes()
    const today = hours.find((h) => h.day === todayIdx)

    if (!today) return { open: null, label: 'Call to confirm today’s hours', todayIdx }

    if (today && !today.closed) {
      const open = toMinutes(today.open)
      let close = toMinutes(today.close)
      if (close <= open) close += 1440 // closes after midnight
      if (mins >= open && mins < close) {
        return { open: true, label: `Open now · closes ${fmtTime(today.close)}`, todayIdx }
      }
      if (mins < open) {
        return { open: false, label: `Closed · opens today at ${fmtTime(today.open)}`, todayIdx }
      }
    }

    // Walk forward to the next open day.
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7
      const d = hours.find((h) => h.day === idx)
      if (d && !d.closed) {
        const when = i === 1 ? 'tomorrow' : DAYS[idx]
        return { open: false, label: `Closed · opens ${when} at ${fmtTime(d.open)}`, todayIdx }
      }
    }
    return { open: false, label: 'Closed', todayIdx }
  }

  const [state, setState] = useState(compute)

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 60000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, utcOffsetMinutes])

  return state
}

export { DAYS }
