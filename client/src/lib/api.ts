/**
 * API client.
 *
 * TEMPORARY: everything below is an in-memory MOCK so the UI can be built before the Express API exists.
 * The function signatures are the contract; when the server lands, each body becomes a fetch() to /api/...
 * with `credentials: 'same-origin'`. Pages must only talk to the backend through this file.
 *
 * The mock login accepts any non-empty username and password. It is not security; it is a placeholder.
 */
import { monthKey } from './dates'
import { buildSeedTransactions, seedCategories, seedRules } from './mock-data'
import type {
  Category,
  DashboardSummary,
  ImportPreview,
  ImportPreviewRow,
  ImportResult,
  ReviewDecision,
  Rule,
  Source,
  Transaction,
  TransactionFilters,
} from './types'

// ---------------------------------------------------------------------------
// In-memory store + change notifications (so the nav badge updates after a review)

const store = {
  categories: [...seedCategories],
  rules: [...seedRules],
  transactions: buildSeedTransactions(),
  skipped: new Set<string>(),
  importedFiles: new Map<string, string>(), // sha256 -> importedAt
  previews: new Map<string, ImportPreview>(),
}

type Listener = () => void
const listeners = new Set<Listener>()
export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const emit = () => listeners.forEach((fn) => fn())

const delay = <T,>(value: T, ms = 150) => new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms))

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Auth

const AUTH_KEY = 'torch.mockSession'

function readSession(): string | null {
  try {
    return sessionStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

export async function me(): Promise<{ username: string } | null> {
  const u = readSession()
  return delay(u ? { username: u } : null, 80)
}

export async function login(username: string, password: string): Promise<{ username: string }> {
  await delay(null, 400)
  if (!username.trim() || !password) throw new ApiError(401, 'Wrong username or password.')
  try {
    sessionStorage.setItem(AUTH_KEY, username.trim())
  } catch {
    /* private mode: session just won't survive a reload */
  }
  return { username: username.trim() }
}

export async function logout(): Promise<void> {
  try {
    sessionStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
  return delay(undefined, 80)
}

// ---------------------------------------------------------------------------
// Categories

export async function listCategories(): Promise<Category[]> {
  return delay([...store.categories].sort((a, b) => a.sortOrder - b.sortOrder))
}

// ---------------------------------------------------------------------------
// Dashboard

function signedForTotals(t: Transaction) {
  // Credits on an expense (refunds) reduce spending. Pending your decision on refunds.
  return t.direction === 'debit' ? t.amountPaise : -t.amountPaise
}

export async function getDashboard(month: string): Promise<DashboardSummary> {
  const inMonth = store.transactions.filter((t) => monthKey(t.date) === month)
  let expensePaise = 0
  let incomePaise = 0
  let transferPaise = 0
  const byCat = new Map<string, number>()
  for (const t of inMonth) {
    if (t.needsReview) continue
    if (t.type === 'expense') {
      expensePaise += signedForTotals(t)
      if (t.categoryId) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + signedForTotals(t))
    } else if (t.type === 'income') {
      incomePaise += t.amountPaise
    } else if (t.type === 'transfer') {
      transferPaise += t.amountPaise
    }
  }
  const queue = reviewQueue()
  return delay({
    month,
    expensePaise,
    incomePaise,
    transferPaise,
    byCategory: [...byCat.entries()].map(([categoryId, paise]) => ({ categoryId, paise })).sort((a, b) => b.paise - a.paise),
    reviewCount: queue.length,
    largestReview: queue[0] ? { payee: queue[0].payee, amountPaise: queue[0].amountPaise } : null,
  })
}

// ---------------------------------------------------------------------------
// Transactions

export async function listTransactions(f: TransactionFilters): Promise<Transaction[]> {
  const rows = store.transactions
    .filter((t) => monthKey(t.date) === f.month)
    .filter((t) => !f.type || f.type === 'all' || t.type === f.type)
    .filter((t) => !f.categoryId || f.categoryId === 'all' || t.categoryId === f.categoryId)
    .sort((a, b) => b.date.localeCompare(a.date))
  return delay(rows)
}

/** Manual edit from the Transactions screen. Marks the decision as manual so rules never overwrite it. */
export async function updateTransaction(id: string, d: Omit<ReviewDecision, 'createRule'>): Promise<Transaction> {
  const t = store.transactions.find((x) => x.id === id)
  if (!t) throw new ApiError(404, 'Transaction not found')
  applyDecision(t, d)
  emit()
  return delay(t)
}

function applyDecision(t: Transaction, d: Omit<ReviewDecision, 'createRule'>) {
  t.type = d.type
  t.categoryId = d.type === 'expense' || d.type === 'income' ? d.categoryId : null
  t.decision = 'manual'
  t.needsReview = false
  t.conflicts = undefined
  store.skipped.delete(t.id)
}

// ---------------------------------------------------------------------------
// Review

function reviewQueue(): Transaction[] {
  const pending = store.transactions.filter((t) => t.needsReview)
  // Largest first; skipped items go to the back of the queue.
  return pending.sort((a, b) => {
    const sa = store.skipped.has(a.id) ? 1 : 0
    const sb = store.skipped.has(b.id) ? 1 : 0
    return sa - sb || b.amountPaise - a.amountPaise
  })
}

export async function getReviewQueue(): Promise<Transaction[]> {
  return delay(reviewQueue())
}

export async function getReviewCount(): Promise<number> {
  return delay(reviewQueue().length, 50)
}

export async function skipReviewItem(id: string): Promise<void> {
  store.skipped.add(id)
  emit()
  return delay(undefined, 50)
}

export interface ReviewResult {
  ruleCreated: Rule | null
  /** Other pending items the new rule also categorised. Only happens after you said yes to the rule. */
  alsoApplied: number
}

export async function resolveReviewItem(id: string, d: ReviewDecision): Promise<ReviewResult> {
  const t = store.transactions.find((x) => x.id === id)
  if (!t) throw new ApiError(404, 'Transaction not found')
  applyDecision(t, d)

  let ruleCreated: Rule | null = null
  let alsoApplied = 0
  if (d.createRule) {
    ruleCreated = {
      id: `r${Date.now()}`,
      matchKind: 'exact',
      pattern: t.payee,
      minPaise: null,
      maxPaise: null,
      source: null,
      type: d.type,
      categoryId: t.categoryId,
      priority: 150,
      origin: 'learned',
    }
    store.rules.push(ruleCreated)
    for (const other of store.transactions) {
      if (other.id !== t.id && other.needsReview && other.decision !== 'manual' && other.payee === t.payee) {
        other.type = d.type
        other.categoryId = t.categoryId
        other.decision = 'rule'
        other.needsReview = false
        alsoApplied++
      }
    }
  }
  emit()
  return delay({ ruleCreated, alsoApplied })
}

// ---------------------------------------------------------------------------
// Rules

export async function listRules(): Promise<Rule[]> {
  return delay([...store.rules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern)))
}

export async function updateRule(rule: Rule): Promise<Rule> {
  const i = store.rules.findIndex((r) => r.id === rule.id)
  if (i < 0) throw new ApiError(404, 'Rule not found')
  store.rules[i] = { ...rule, pattern: rule.pattern.trim().toUpperCase() }
  emit()
  return delay(store.rules[i])
}

export async function deleteRule(id: string): Promise<void> {
  store.rules = store.rules.filter((r) => r.id !== id)
  emit()
  return delay(undefined)
}

// ---------------------------------------------------------------------------
// Import

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const previewPayees: Omit<ImportPreviewRow, 'rowNumber' | 'date'>[] = [
  { amountPaise: 52300, direction: 'debit', payee: 'SWIGGY', type: 'expense', categoryId: 'cat_food', status: 'new' },
  { amountPaise: 48700, direction: 'debit', payee: 'SWIGGY', type: 'expense', categoryId: 'cat_food', status: 'duplicate' },
  { amountPaise: 150000, direction: 'debit', payee: 'MEENA T', type: null, categoryId: null, status: 'needs_review' },
  { amountPaise: 91800, direction: 'debit', payee: 'ZEPTO', type: 'expense', categoryId: 'cat_groceries', status: 'new' },
  { amountPaise: 300000, direction: 'debit', payee: 'INDIAN OIL KORAMANGALA', type: 'expense', categoryId: 'cat_fuel', status: 'duplicate' },
  { amountPaise: 34900, direction: 'debit', payee: 'THIRD WAVE COFFEE', type: null, categoryId: null, status: 'needs_review' },
  { amountPaise: 11000, direction: 'debit', payee: 'CHAI POINT', type: 'expense', categoryId: 'cat_snacks', status: 'new' },
  { amountPaise: 200000, direction: 'credit', payee: 'ARJUN P', type: null, categoryId: null, status: 'needs_review' },
  { amountPaise: 67500, direction: 'debit', payee: 'SURESH DAIRY', type: 'expense', categoryId: 'cat_groceries', status: 'new' },
  { amountPaise: 126450, direction: 'debit', payee: 'ZEPTO', type: 'expense', categoryId: 'cat_groceries', status: 'duplicate' },
]

export async function previewImport(file: File, parser: Source): Promise<ImportPreview> {
  if (parser !== 'phonepe') throw new ApiError(400, 'Only PhonePe CSV is supported so far.')
  if (!file.name.toLowerCase().endsWith('.csv')) throw new ApiError(400, 'Choose a .csv file.')
  const fileSha256 = await sha256Hex(file)
  const now = Date.now()
  // MOCK: the real server parses the file. Here we fabricate rows so the screen can be designed.
  const rows: ImportPreviewRow[] = previewPayees.map((r, i) => ({
    ...r,
    rowNumber: i + 2,
    date: new Date(now - i * 20 * 60 * 60 * 1000).toISOString(),
  }))
  const previouslyImportedAt = store.importedFiles.get(fileSha256) ?? null
  if (previouslyImportedAt) rows.forEach((r) => (r.status = 'duplicate'))
  const preview: ImportPreview = {
    id: `imp_${now}`,
    fileName: file.name,
    fileSha256,
    parser,
    previouslyImportedAt,
    counts: {
      new: rows.filter((r) => r.status === 'new').length,
      duplicate: rows.filter((r) => r.status === 'duplicate').length,
      needsReview: rows.filter((r) => r.status === 'needs_review').length,
    },
    rows,
  }
  store.previews.set(preview.id, preview)
  return delay(preview, 600)
}

export async function confirmImport(previewId: string): Promise<ImportResult> {
  const p = store.previews.get(previewId)
  if (!p) throw new ApiError(410, 'This preview expired. Upload the file again.')
  for (const r of p.rows) {
    if (r.status === 'duplicate') continue
    const review = r.status === 'needs_review'
    store.transactions.push({
      id: `t_${p.id}_${r.rowNumber}`,
      date: r.date,
      amountPaise: r.amountPaise,
      direction: r.direction,
      type: r.type ?? (r.direction === 'credit' ? 'income' : 'expense'),
      categoryId: r.categoryId,
      payee: r.payee,
      descriptionRaw: `UPI/${review ? 'P2P' : 'P2M'}/${r.payee}/••••@ybl`,
      descriptionNormalised: r.payee,
      source: p.parser,
      accountLast4: '4821',
      isPersonToPerson: review && !r.payee.includes(' COFFEE'),
      decision: review ? 'none' : 'rule',
      needsReview: review,
    })
  }
  store.importedFiles.set(p.fileSha256, new Date().toISOString())
  store.previews.delete(previewId)
  emit()
  return delay({ inserted: p.counts.new + p.counts.needsReview, skippedDuplicates: p.counts.duplicate, sentToReview: p.counts.needsReview }, 400)
}
