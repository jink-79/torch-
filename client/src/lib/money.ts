/**
 * Money formatting. Input is always integer paise; this file never does float arithmetic on money.
 */

const rupeeGrouping = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export interface FormatOptions {
  /** Show ".00" paise. Default false (dashboard-style whole rupees, truncated toward zero). */
  paise?: boolean
  /** Prefix credits with "+". */
  sign?: '+' | '-' | null
}

export function formatPaise(amountPaise: number, opts: FormatOptions = {}): string {
  if (!Number.isSafeInteger(amountPaise)) {
    throw new Error(`formatPaise expects an integer number of paise, got ${amountPaise}`)
  }
  const negative = amountPaise < 0
  const abs = Math.abs(amountPaise)
  const rupees = Math.trunc(abs / 100)
  const p = abs % 100
  let out = `₹${rupeeGrouping.format(rupees)}`
  if (opts.paise) out += `.${String(p).padStart(2, '0')}`
  const sign = negative ? '-' : opts.sign ?? ''
  return sign + out
}

/**
 * Parse what a person types in a rupee field ("1,234.5", "₹ 200") into integer paise, using string
 * operations only. Returns null for empty input, NaN for anything invalid.
 */
export function parseRupeesToPaise(input: string): number | null {
  const s = input.replace(/[₹,\s]/g, '')
  if (s === '') return null
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return Number.NaN
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'))
}

/** Inverse of parseRupeesToPaise, for pre-filling inputs. */
export function paiseToInput(paise: number | null): string {
  if (paise === null) return ''
  const r = Math.trunc(paise / 100)
  const p = paise % 100
  return p === 0 ? String(r) : `${r}.${String(p).padStart(2, '0')}`
}
