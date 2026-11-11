import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { formatMonth, shiftMonth } from '@/lib/dates'
import { formatPaise } from '@/lib/money'
import type { Category, Direction, TxnType } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PageHeader({ title, children, className }: { title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex min-h-11 items-center justify-between gap-3 pt-4 pb-4 md:pt-10 md:pb-6', className)}>
      <h1 className="text-[22px] font-bold tracking-tight md:text-[28px]">{title}</h1>
      {children}
    </header>
  )
}

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-[5.5rem] text-center text-[15px] font-semibold" aria-live="polite">
        {formatMonth(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-[18px] border border-border bg-surface', className)} {...props} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-surface-2', className)} />
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon && <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">{icon}</div>}
      <p className="text-[17px] font-semibold">{title}</p>
      {children && <div className="max-w-xs text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  )
}

/** Credits show "+", debits show plain. Transfers and ignored items are muted so they never read as spending. */
export function Amount({
  paise,
  direction,
  type,
  decimals = true,
  className,
}: {
  paise: number
  direction: Direction
  type?: TxnType
  decimals?: boolean
  className?: string
}) {
  const muted = type === 'transfer' || type === 'ignore'
  return (
    <span className={cn('font-semibold whitespace-nowrap', muted && 'font-medium text-muted', className)}>
      {formatPaise(paise, { paise: decimals, sign: direction === 'credit' ? '+' : null })}
    </span>
  )
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-1 rounded-[14px] bg-surface-2 p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-11 cursor-pointer rounded-[10px] text-sm font-medium text-muted transition-colors',
              on && 'bg-surface font-semibold text-text shadow-[0_1px_2px_rgb(0_0_0/0.08)]',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function CategoryGrid({
  categories,
  value,
  onPick,
}: {
  categories: Category[]
  value: string | null
  onPick: (id: string) => void
}) {
  return (
    <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {categories.map((c) => {
        const on = c.id === value
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(c.id)}
            className={cn(
              'h-13 cursor-pointer rounded-xl border border-border bg-surface px-4 text-left text-[15px] font-medium transition-colors hover:bg-surface-2 active:bg-surface-2',
              on && 'border-accent bg-accent text-on-accent hover:bg-accent active:bg-accent',
            )}
          >
            {c.name}
          </button>
        )
      })}
    </div>
  )
}

export const typeLabel: Record<TxnType, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
  ignore: 'Ignored',
}

export const sourceLabel = { phonepe: 'PhonePe', axis: 'Axis', sbi: 'SBI', card: 'Credit card' } as const

/** Debits can be expense/transfer/ignore; credits can be income/transfer/ignore. */
export function typeOptionsFor(direction: Direction): { value: TxnType; label: string }[] {
  const first: TxnType = direction === 'debit' ? 'expense' : 'income'
  return [
    { value: first, label: typeLabel[first] },
    { value: 'transfer', label: 'Transfer' },
    { value: 'ignore', label: 'Ignore' },
  ]
}

export const needsCategory = (t: TxnType) => t === 'expense' || t === 'income'
