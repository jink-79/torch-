import { useEffect, useRef, useState } from 'react'
import { CircleAlert, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'

import {
  Card,
  CategoryGrid,
  EmptyState,
  PageHeader,
  Skeleton,
  SegmentedControl,
  needsCategory,
  sourceLabel,
  typeLabel,
  typeOptionsFor,
} from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { getReviewQueue, resolveReviewItem, skipReviewItem } from '@/lib/api'
import { formatDay, formatTime } from '@/lib/dates'
import { useApi, useCategories } from '@/lib/hooks'
import { formatPaise } from '@/lib/money'
import type { Transaction, TxnType } from '@/lib/types'

export default function Review() {
  const { data: queue } = useApi(getReviewQueue, [])
  const [toast, setToast] = useState<string | null>(null)
  const [done, setDone] = useState(0)

  // Progress: "3 of 14" where 14 is everything that was pending when you opened the screen (or more, if an import added items).
  const total = useRef(0)
  if (queue) total.current = Math.max(total.current, queue.length + done)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const current = queue?.[0]

  return (
    <>
      <PageHeader title="Review">
        {current && (
          <Button variant="link" className="px-1" onClick={() => skipReviewItem(current.id)} disabled={queue.length < 2}>
            Skip
          </Button>
        )}
      </PageHeader>

      {!queue ? (
        <div className="flex flex-col gap-3.5">
          <Skeleton className="h-52" />
          <Skeleton className="h-12" />
          <Skeleton className="h-60" />
        </div>
      ) : !current ? (
        <EmptyState icon={<PartyPopper className="size-6" />} title="All caught up">
          Nothing needs a decision right now. New items appear here after an import.
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-1.5">
            <div
              className="h-1 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total.current}
              aria-valuenow={done + 1}
              aria-label="Review progress"
            >
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${((done + 1) / Math.max(1, total.current)) * 100}%` }} />
            </div>
            <span className="text-xs text-muted">
              {done + 1} of {total.current} · largest first
            </span>
          </div>

          <ReviewItem
            key={current.id}
            item={current}
            onResolved={(msg) => {
              setDone((d) => d + 1)
              setToast(msg)
            }}
          />
        </>
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-5 md:bottom-8">
        {toast && (
          <div className="pointer-events-auto max-w-sm rounded-2xl bg-text px-4 py-3 text-sm font-medium text-surface shadow-lg">{toast}</div>
        )}
      </div>
    </>
  )
}

function ReviewItem({ item, onResolved }: { item: Transaction; onResolved: (message: string) => void }) {
  const cats = useCategories()
  const typeOptions = typeOptionsFor(item.direction)
  const [type, setType] = useState<TxnType>(typeOptions[0].value)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [askRule, setAskRule] = useState(false)
  const [saving, setSaving] = useState(false)

  const verb = item.direction === 'debit' ? 'Paid to' : 'Received from'
  const decisionLabel = needsCategory(type) ? cats.name(categoryId) : typeLabel[type]

  function pickCategory(id: string) {
    setCategoryId(id)
    setAskRule(true)
  }

  async function save(createRule: boolean) {
    setSaving(true)
    const res = await resolveReviewItem(item.id, { type, categoryId: needsCategory(type) ? categoryId : null, createRule })
    setAskRule(false)
    let msg = `Saved as ${decisionLabel}.`
    if (res.ruleCreated) msg += ` Rule created for ${item.payee}.`
    if (res.alsoApplied > 0) msg += ` Also applied to ${res.alsoApplied} other pending item${res.alsoApplied > 1 ? 's' : ''}.`
    onResolved(msg)
  }

  return (
    <div className="flex flex-col gap-3.5 md:gap-5">
      <Card className="flex flex-col gap-2.5 p-4 md:gap-3 md:p-5">
        <div className="flex flex-wrap gap-2">
          {item.isPersonToPerson && <Badge>Person-to-person</Badge>}
          {item.conflicts?.length ? (
            <Badge variant="outline">
              <CircleAlert /> Rules disagree
            </Badge>
          ) : (
            <Badge variant="outline">No rule for payee</Badge>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[32px] leading-tight md:text-[36px] font-bold tracking-[-0.025em]">
            {formatPaise(item.amountPaise, { paise: true, sign: item.direction === 'credit' ? '+' : null })}
          </span>
          <span className="text-[17px] font-medium">
            {verb} {item.payee}
          </span>
          <span className="text-[13px] text-muted">
            {formatDay(item.date)}, {formatTime(item.date)} · {sourceLabel[item.source]}
            {item.accountLast4 && ` ••${item.accountLast4}`}
          </span>
        </div>
        <code className="block rounded-[10px] bg-bg px-2.5 py-2 font-mono text-xs break-all text-muted">{item.descriptionRaw}</code>
      </Card>

      {item.conflicts && item.conflicts.length > 1 && (
        <div className="rounded-[14px] border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-semibold">Two rules matched with different categories</p>
          <ul className="flex flex-col gap-1 text-sm text-muted">
            {item.conflicts.map((c) => (
              <li key={c.ruleId}>
                “{c.pattern}” → <span className="font-medium text-text">{c.categoryId ? cats.name(c.categoryId) : typeLabel[c.type]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Pick the right one below. You can fix the rules on the Rules screen.</p>
        </div>
      )}

      <SegmentedControl
        label="Type"
        value={type}
        options={typeOptions}
        onChange={(t) => {
          setType(t)
          setCategoryId(null)
        }}
      />

      {needsCategory(type) ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Category</span>
          <CategoryGrid categories={cats.list} value={categoryId} onPick={pickCategory} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            {type === 'transfer'
              ? 'Transfers move your own money between accounts and cards. They never count as spending.'
              : 'Ignored items are kept for the record but left out of every total.'}
          </p>
          <Button size="lg" onClick={() => setAskRule(true)}>
            Save as {typeLabel[type]}
          </Button>
        </div>
      )}

      <Sheet open={askRule} onOpenChange={(o) => !saving && setAskRule(o)}>
        <SheetContent aria-describedby="rule-desc">
          <SheetHeader>
            <span className="text-[13px] text-muted">
              {decisionLabel} · {formatPaise(item.amountPaise, { paise: true })}
            </span>
            <SheetTitle>
              Apply to future {item.direction === 'debit' ? 'payments to' : 'money from'} {item.payee}?
            </SheetTitle>
            <SheetDescription id="rule-desc">
              Creates a learned rule for this exact payee{item.isPersonToPerson ? '. Other people stay in review.' : '.'} You can edit or
              delete it in Rules.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button size="lg" disabled={saving} onClick={() => save(true)}>
              Yes, create rule
            </Button>
            <Button size="lg" variant="outline" disabled={saving} onClick={() => save(false)}>
              Just this one
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
