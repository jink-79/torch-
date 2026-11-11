/**
 * Shapes shared with the (future) Express API.
 * All money is integer paise. Never floats.
 */

export type TxnType = 'expense' | 'income' | 'transfer' | 'ignore'
export type Direction = 'debit' | 'credit'
export type Source = 'phonepe' | 'axis' | 'sbi' | 'card'

/** How the current type/category was decided. Manual is never overwritten by re-running rules. */
export type Decision = 'manual' | 'rule' | 'none'

export interface Category {
  id: string
  name: string
  sortOrder: number
}

export interface RuleMatch {
  ruleId: string
  pattern: string
  type: TxnType
  categoryId: string | null
}

export interface Transaction {
  id: string
  /** ISO 8601, UTC. Displayed in Asia/Kolkata. */
  date: string
  amountPaise: number
  direction: Direction
  type: TxnType
  /** Only set when type is expense or income. */
  categoryId: string | null
  payee: string
  /** Masked on ingest: no full account, card, UPI ID or phone number. */
  descriptionRaw: string
  descriptionNormalised: string
  source: Source
  accountLast4: string | null
  isPersonToPerson: boolean
  decision: Decision
  needsReview: boolean
  /** Present when two or more rules matched with different outcomes. */
  conflicts?: RuleMatch[]
}

export type MatchKind = 'contains' | 'startsWith' | 'exact'

export interface Rule {
  id: string
  matchKind: MatchKind
  pattern: string
  minPaise: number | null
  maxPaise: number | null
  source: Source | null
  type: TxnType
  categoryId: string | null
  priority: number
  origin: 'seed' | 'learned'
}

export type PreviewStatus = 'new' | 'duplicate' | 'needs_review'

export interface ImportPreviewRow {
  rowNumber: number
  date: string
  amountPaise: number
  direction: Direction
  payee: string
  type: TxnType | null
  categoryId: string | null
  status: PreviewStatus
}

export interface ImportPreview {
  id: string
  fileName: string
  fileSha256: string
  parser: Source
  /** Set when this exact file (same SHA-256) has been imported before. */
  previouslyImportedAt: string | null
  counts: { new: number; duplicate: number; needsReview: number }
  rows: ImportPreviewRow[]
}

export interface ImportResult {
  inserted: number
  skippedDuplicates: number
  sentToReview: number
}

export interface DashboardSummary {
  /** YYYY-MM */
  month: string
  expensePaise: number
  incomePaise: number
  transferPaise: number
  byCategory: { categoryId: string; paise: number }[]
  reviewCount: number
  largestReview: { payee: string; amountPaise: number } | null
}

export interface TransactionFilters {
  month: string
  type?: TxnType | 'all'
  categoryId?: string | 'all'
}

export interface ReviewDecision {
  type: TxnType
  categoryId: string | null
  createRule: boolean
}

export type ThemePreference = 'system' | 'light' | 'dark'
export type ImportFrequency = 'off' | 'weekly' | 'monthly'

export interface Preferences {
  /** Shown in the avatar and greeting. Defaults to the username. */
  displayName: string
  theme: ThemePreference
  notifications: {
    /** Nudge when items are waiting in Review. */
    reviewReminders: boolean
    /** Nudge on the import schedule below. */
    importReminders: boolean
  }
  importSchedule: {
    frequency: ImportFrequency
    /** 0 = Sunday ... 6 = Saturday. Used when weekly. */
    weekday: number
    /** 1–28 so every month has it. Used when monthly. */
    dayOfMonth: number
    /** Hour of day in IST, 0–23. */
    hour: number
  }
}
