/** All display and month bucketing is in India time, regardless of the device's zone. */
export const TIME_ZONE = 'Asia/Kolkata'

const dayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true })
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short' })
const monthFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', month: 'short', year: 'numeric' })
const monthLongFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', month: 'long' })
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

export const formatDay = (iso: string) => dayFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).toLowerCase()
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso))

/** YYYY-MM-DD in IST, for grouping. */
export const dayKey = (iso: string) => keyFmt.format(new Date(iso))
/** YYYY-MM in IST. */
export const monthKey = (iso: string) => dayKey(iso).slice(0, 7)

export function currentMonth(): string {
  return monthKey(new Date().toISOString())
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthDate(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
}

export const formatMonth = (month: string) => monthFmt.format(monthDate(month))
export const formatMonthLong = (month: string) => monthLongFmt.format(monthDate(month))
