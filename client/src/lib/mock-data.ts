/**
 * SYNTHETIC data for building the UI before the API exists.
 * Every payee, amount, reference and account digit here is invented. Never paste real statement data in this file.
 */
import type { Category, Rule, Source, Transaction, TxnType } from './types'

export const seedCategories: Category[] = [
  { id: 'cat_food', name: 'Food', sortOrder: 1 },
  { id: 'cat_snacks', name: 'Snacks', sortOrder: 2 },
  { id: 'cat_fuel', name: 'Fuel', sortOrder: 3 },
  { id: 'cat_bills', name: 'Bills', sortOrder: 4 },
  { id: 'cat_groceries', name: 'Groceries', sortOrder: 5 },
  { id: 'cat_shopping', name: 'Shopping', sortOrder: 6 },
  { id: 'cat_other', name: 'Other', sortOrder: 7 },
]

export const seedRules: Rule[] = [
  { id: 'r1', matchKind: 'contains', pattern: 'CREDIT CARD BILL', minPaise: null, maxPaise: null, source: null, type: 'transfer', categoryId: null, priority: 10, origin: 'seed' },
  { id: 'r2', matchKind: 'contains', pattern: 'SELF TRANSFER', minPaise: null, maxPaise: null, source: null, type: 'transfer', categoryId: null, priority: 10, origin: 'seed' },
  { id: 'r3', matchKind: 'exact', pattern: 'SWIGGY', minPaise: null, maxPaise: null, source: null, type: 'expense', categoryId: 'cat_food', priority: 100, origin: 'seed' },
  { id: 'r4', matchKind: 'exact', pattern: 'ZEPTO', minPaise: null, maxPaise: null, source: null, type: 'expense', categoryId: 'cat_groceries', priority: 100, origin: 'seed' },
  { id: 'r5', matchKind: 'startsWith', pattern: 'INDIAN OIL', minPaise: null, maxPaise: null, source: null, type: 'expense', categoryId: 'cat_fuel', priority: 100, origin: 'seed' },
  { id: 'r6', matchKind: 'contains', pattern: 'ELECTRICITY', minPaise: null, maxPaise: null, source: null, type: 'expense', categoryId: 'cat_bills', priority: 100, origin: 'seed' },
  { id: 'r7', matchKind: 'contains', pattern: 'AMAZON', minPaise: null, maxPaise: null, source: null, type: 'expense', categoryId: 'cat_shopping', priority: 100, origin: 'seed' },
  { id: 'r8', matchKind: 'contains', pattern: 'CHAI', minPaise: null, maxPaise: 30000, source: null, type: 'expense', categoryId: 'cat_snacks', priority: 200, origin: 'seed' },
  { id: 'r9', matchKind: 'contains', pattern: 'SALARY', minPaise: null, maxPaise: null, source: 'axis', type: 'income', categoryId: 'cat_other', priority: 100, origin: 'seed' },
  { id: 'r10', matchKind: 'exact', pattern: 'SURESH DAIRY', minPaise: null, maxPaise: null, source: 'phonepe', type: 'expense', categoryId: 'cat_groceries', priority: 150, origin: 'learned' },
]

interface Template {
  payee: string
  paise: number
  direction?: 'debit' | 'credit'
  type?: TxnType
  categoryId?: string | null
  source?: Source
  p2p?: boolean
  review?: boolean
  conflict?: [string, string]
}

// Spread over ~25 days back from "now" so the current and previous month both have data.
const templates: Template[] = [
  { payee: 'RAMESH K', paise: 345000, p2p: true, review: true },
  { payee: 'SWIGGY', paise: 48700, type: 'expense', categoryId: 'cat_food' },
  { payee: 'ZEPTO', paise: 126450, type: 'expense', categoryId: 'cat_groceries' },
  { payee: 'CHAI POINT SWIGGY', paise: 26000, review: true, conflict: ['cat_food', 'cat_snacks'] },
  { payee: 'INDIAN OIL KORAMANGALA', paise: 300000, type: 'expense', categoryId: 'cat_fuel', source: 'axis' },
  { payee: 'HDFC CREDIT CARD BILL', paise: 2450000, type: 'transfer', categoryId: null, source: 'axis' },
  { payee: 'BLUE TOKAI', paise: 64000, review: true },
  { payee: 'SURESH DAIRY', paise: 84000, type: 'expense', categoryId: 'cat_groceries' },
  { payee: 'AMAZON PAY', paise: 210500, type: 'expense', categoryId: 'cat_shopping', source: 'card' },
  { payee: 'PRIYA S', paise: 120000, direction: 'credit', p2p: true, review: true },
  { payee: 'SWIGGY', paise: 61200, type: 'expense', categoryId: 'cat_food' },
  { payee: 'ACME TECH SALARY', paise: 8500000, direction: 'credit', type: 'income', categoryId: 'cat_other', source: 'axis' },
  { payee: 'BESCOM ELECTRICITY', paise: 186000, type: 'expense', categoryId: 'cat_bills', source: 'sbi' },
  { payee: 'DMART', paise: 287500, review: true },
  { payee: 'CHAI POINT', paise: 9000, type: 'expense', categoryId: 'cat_snacks' },
  { payee: 'ZEPTO', paise: 78900, type: 'expense', categoryId: 'cat_groceries' },
  { payee: 'ANIL MEHTA', paise: 50000, p2p: true, review: true },
  { payee: 'INDIAN OIL HSR', paise: 330000, type: 'expense', categoryId: 'cat_fuel', source: 'axis' },
  { payee: 'SWIGGY', paise: 39900, type: 'expense', categoryId: 'cat_food' },
  { payee: 'AIRTEL POSTPAID', paise: 59900, review: true },
  { payee: 'SELF TRANSFER SBI', paise: 1000000, type: 'transfer', categoryId: null, source: 'sbi' },
  { payee: 'CHAI POINT', paise: 12000, type: 'expense', categoryId: 'cat_snacks' },
  { payee: 'AMAZON PAY', paise: 89900, type: 'expense', categoryId: 'cat_shopping', source: 'card' },
  { payee: 'SWIGGY', paise: 55600, type: 'expense', categoryId: 'cat_food' },
  { payee: 'GOOGLE PLAY', paise: 13000, type: 'ignore', categoryId: null },
  { payee: 'ZEPTO', paise: 64300, type: 'expense', categoryId: 'cat_groceries' },
  { payee: 'KAVYA R', paise: 75000, p2p: true, review: true },
  { payee: 'SWIGGY', paise: 72800, type: 'expense', categoryId: 'cat_food' },
  { payee: 'INDIAN OIL KORAMANGALA', paise: 280000, type: 'expense', categoryId: 'cat_fuel', source: 'axis' },
  { payee: 'CROMA', paise: 449900, review: true, source: 'card' },
]

const fakeLast4: Record<Source, string> = { phonepe: '4821', axis: '4821', sbi: '7710', card: '3092' }

function maskedRaw(t: Template, source: Source): string {
  if (source === 'phonepe' || t.p2p) {
    const kind = t.p2p ? 'P2P' : 'P2M'
    return `UPI/${kind}/${t.payee}/••••@ybl`
  }
  if (source === 'card') return `${t.payee} BANGALORE IN`
  return `NEFT/${t.payee}/XX${fakeLast4[source]}`
}

export function buildSeedTransactions(now = new Date()): Transaction[] {
  return templates.map((t, i) => {
    const source = t.source ?? 'phonepe'
    const date = new Date(now.getTime() - (i * 20 + 3) * 60 * 60 * 1000)
    const conflicts = t.conflict?.map((categoryId, j) => ({
      ruleId: j === 0 ? 'r3' : 'r8',
      pattern: j === 0 ? 'SWIGGY' : 'CHAI',
      type: 'expense' as const,
      categoryId,
    }))
    return {
      id: `t${i + 1}`,
      date: date.toISOString(),
      amountPaise: t.paise,
      direction: t.direction ?? 'debit',
      type: t.type ?? (t.direction === 'credit' ? 'income' : 'expense'),
      categoryId: t.review ? null : t.categoryId ?? null,
      payee: t.payee,
      descriptionRaw: maskedRaw(t, source),
      descriptionNormalised: t.payee,
      source,
      accountLast4: fakeLast4[source],
      isPersonToPerson: Boolean(t.p2p),
      decision: t.review ? 'none' : 'rule',
      needsReview: Boolean(t.review),
      conflicts,
    }
  })
}
