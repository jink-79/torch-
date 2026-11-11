import { useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { useSearchParams } from 'react-router'

import {
  Amount,
  CategoryGrid,
  EmptyState,
  MonthSwitcher,
  PageHeader,
  SegmentedControl,
  Skeleton,
  needsCategory,
  sourceLabel,
  typeLabel,
  typeOptionsFor,
} from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { listTransactions, updateTransaction } from '@/lib/api'
import { dayKey, formatDay, formatTime, formatWeekday } from '@/lib/dates'
import { useApi, useCategories, useMonth } from '@/lib/hooks'
import { formatPaise } from '@/lib/money'
import type { Transaction, TxnType } from '@/lib/types'
import { cn } from '@/lib/utils'

const typeFilterOptions: { value: TxnType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'ignore', label: 'Ignored' },
]

export default function Transactions() {
  const [month, setMonth] = useMonth()
  const [params, setParams] = useSearchParams()
  const type = (params.get('t') as TxnType | 'all' | null) ?? 'all'
  const categoryId = params.get('c') ?? 'all'
  const cats = useCategories()
  const [open, setOpen] = useState<Transaction | null>(null)

  const { data } = useApi(() => listTransactions({ month, type, categoryId }), [month, type, categoryId])

  function setParam(key: string, value: string) {
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value === 'all') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  // Group by IST calendar day, newest first.
  const groups: { key: string; label: string; items: Transaction[] }[] = []
  for (const t of data ?? []) {
    const k = dayKey(t.date)
    const last = groups[groups.length - 1]
    if (last?.key === k) last.items.push(t)
    else groups.push({ key: k, label: formatWeekday(t.date), items: [t] })
  }

  return (
    <>
      <PageHeader title="Transactions">
        <MonthSwitcher month={month} onChange={setMonth} />
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Select value={type} onValueChange={(v) => setParam('t', v)}>
          <SelectTrigger aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeFilterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={(v) => setParam('c', v)}>
          <SelectTrigger aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectSeparator />
            {cats.list.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={<ReceiptText className="size-6" />} title="No transactions">
          Nothing matches these filters for this month.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="sticky top-[env(safe-area-inset-top)] z-10 -mx-5 bg-bg/95 px-5 py-2 text-[13px] font-semibold text-muted backdrop-blur md:-mx-10 md:px-10">
                {g.label}
              </h2>
              <ul className="overflow-hidden rounded-[18px] border border-border bg-surface">
                {g.items.map((t, i) => (
                  <li key={t.id} className={cn(i > 0 && 'border-t border-border')}>
                    <button
                      type="button"
                      onClick={() => setOpen(t)}
                      className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/60"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[15px] font-medium">{t.payee}</span>
                        <span className="flex items-center gap-1.5 truncate text-[13px] text-muted">
                          {t.needsReview ? (
                            <>
                              <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                              Needs review
                            </>
                          ) : needsCategory(t.type) ? (
                            cats.name(t.categoryId)
                          ) : (
                            typeLabel[t.type]
                          )}
                          <span aria-hidden="true">·</span>
                          {sourceLabel[t.source]}
                        </span>
                      </span>
                      <Amount paise={t.amountPaise} direction={t.direction} type={t.type} className="text-[15px]" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <TransactionSheet txn={open} onClose={() => setOpen(null)} />
    </>
  )
}

function TransactionSheet({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  return (
    <Sheet open={txn !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent showClose aria-describedby={undefined}>
        {txn && <TransactionEditor key={txn.id} txn={txn} onDone={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function TransactionEditor({ txn, onDone }: { txn: Transaction; onDone: () => void }) {
  const cats = useCategories()
  const [type, setType] = useState<TxnType>(txn.type)
  const [categoryId, setCategoryId] = useState<string | null>(txn.categoryId)
  const [saving, setSaving] = useState(false)
  const changed = type !== txn.type || categoryId !== txn.categoryId
  const valid = !needsCategory(type) || categoryId !== null

  async function save() {
    setSaving(true)
    await updateTransaction(txn.id, { type, categoryId })
    onDone()
  }

  return (
    <>
      <SheetHeader className="pr-10">
        <SheetTitle>{txn.payee}</SheetTitle>
        <SheetDescription>
          {formatDay(txn.date)}, {formatTime(txn.date)} · {sourceLabel[txn.source]}
          {txn.accountLast4 && ` ••${txn.accountLast4}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[32px] leading-tight font-bold tracking-tight">
          {formatPaise(txn.amountPaise, { paise: true, sign: txn.direction === 'credit' ? '+' : null })}
        </span>
        <Badge variant="outline">
          {txn.decision === 'manual' ? 'Set by you' : txn.decision === 'rule' ? 'Set by rule' : 'Undecided'}
        </Badge>
      </div>
      <code className="block rounded-[10px] bg-bg px-2.5 py-2 font-mono text-xs break-all text-muted">{txn.descriptionRaw}</code>

      <SegmentedControl
        label="Type"
        value={type}
        options={typeOptionsFor(txn.direction)}
        onChange={(t) => {
          setType(t)
          if (!needsCategory(t)) setCategoryId(null)
        }}
      />
      {needsCategory(type) && <CategoryGrid categories={cats.list} value={categoryId} onPick={setCategoryId} />}

      <SheetFooter>
        <Button size="lg" disabled={!changed || !valid || saving} onClick={save}>
          Save
        </Button>
        <p className="text-center text-xs text-muted">Changes made here are never overwritten by rules.</p>
      </SheetFooter>
    </>
  )
}
