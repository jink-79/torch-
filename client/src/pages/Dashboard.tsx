import { ChevronRight, FileUp, PieChart } from 'lucide-react'
import { Link } from 'react-router'

import { Card, EmptyState, MonthSwitcher, PageHeader, Skeleton } from '@/components/common'
import { Wordmark } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { getDashboard } from '@/lib/api'
import { formatMonthLong, formatWeekday, nextScheduled } from '@/lib/dates'
import { useApi, useCategories, useMonth } from '@/lib/hooks'
import { formatPaise } from '@/lib/money'
import { usePreferences } from '@/lib/preferences'

export default function Dashboard() {
  const [month, setMonth] = useMonth()
  const { data, error } = useApi(() => getDashboard(month), [month])
  const cats = useCategories()

  const max = data?.byCategory[0]?.paise ?? 0

  return (
    <>
      <PageHeader title={<><Wordmark className="md:hidden" /><span className="hidden md:inline">Home</span></>}>
        <MonthSwitcher month={month} onChange={setMonth} />
      </PageHeader>

      <ImportCard />

      {error && <p role="alert" className="text-sm text-danger">Couldn’t load this month. {error.message}</p>}

      {!data ? (
        <div className="flex flex-col gap-3.5">
          <Skeleton className="h-36" />
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 md:grid md:grid-cols-2 md:gap-5">
          <Card className="flex flex-col gap-1.5 p-5">
            <span className="text-[13px] text-muted">Spent in {formatMonthLong(month)}</span>
            <span className="text-[40px] leading-tight font-bold tracking-[-0.025em]">{formatPaise(data.expensePaise)}</span>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
              <span>
                Income <strong className="font-semibold text-text">{formatPaise(data.incomePaise, { sign: data.incomePaise > 0 ? '+' : null })}</strong>
              </span>
              <span>Transfers {formatPaise(data.transferPaise)} · not counted</span>
            </div>
          </Card>

          {data.reviewCount > 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-[18px] bg-accent-soft py-3.5 pr-3.5 pl-[18px]">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{data.reviewCount} need review</span>
                {data.largestReview && (
                  <span className="truncate text-[13px] text-muted">
                    Largest: {formatPaise(data.largestReview.amountPaise)} to {data.largestReview.payee}
                  </span>
                )}
              </div>
              <Button asChild>
                <Link to="/review">Review</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center rounded-[18px] bg-accent-soft px-[18px] py-4 text-[15px] font-medium">
              Nothing to review. All caught up.
            </div>
          )}

          <section aria-labelledby="by-cat" className="mt-1 flex flex-col md:col-span-2">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 id="by-cat" className="text-[15px] font-semibold">
                By category
              </h2>
              <span className="text-[13px] text-muted">Expenses only</span>
            </div>
            {data.byCategory.length === 0 ? (
              <EmptyState icon={<PieChart className="size-6" />} title={`No expenses in ${formatMonthLong(month)}`}>
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/import">
                    <FileUp /> Import a statement
                  </Link>
                </Button>
              </EmptyState>
            ) : (
              <ul className="flex flex-col">
                {data.byCategory.map((row) => (
                  <li key={row.categoryId}>
                    <Link
                      to={`/transactions?m=${month}&c=${row.categoryId}`}
                      className="-mx-2 flex min-h-11 flex-col justify-center gap-1.5 rounded-xl px-2 py-2 hover:bg-surface-2"
                    >
                      <span className="flex justify-between text-sm">
                        <span>{cats.name(row.categoryId)}</span>
                        <span className="font-semibold">{formatPaise(row.paise)}</span>
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${max > 0 ? Math.max(2, Math.round((row.paise / max) * 100)) : 0}%` }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}

/** Entry point to Import on phones (it has no tab). Opens the same Import screen. */
function ImportCard() {
  const { prefs } = usePreferences()
  const next = prefs ? nextScheduled(prefs.importSchedule) : null
  const hint = next ? `Next import due ${formatWeekday(next)}` : 'PhonePe CSV · preview before anything is saved'

  return (
    <Link
      to="/import"
      className="mb-3.5 flex min-h-[72px] items-center gap-3.5 rounded-[18px] border border-border bg-surface py-3.5 pr-3 pl-4 transition-colors hover:bg-surface-2/60 active:bg-surface-2 md:mb-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent" aria-hidden="true">
        <FileUp className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">Import a statement</span>
        <span className="truncate text-[13px] text-muted">{hint}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  )
}
