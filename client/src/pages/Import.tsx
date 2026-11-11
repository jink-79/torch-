import { useId, useState, type FormEvent } from 'react'
import { CircleAlert, CircleCheck, FileText, FileUp } from 'lucide-react'
import { Link } from 'react-router'

import { Amount, Card, PageHeader, sourceLabel, typeLabel } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiError, confirmImport, previewImport } from '@/lib/api'
import { formatDay } from '@/lib/dates'
import { useCategories } from '@/lib/hooks'
import type { ImportPreview, ImportResult, PreviewStatus, Source } from '@/lib/types'
import { cn } from '@/lib/utils'

const parsers: { value: Source; label: string; ready: boolean }[] = [
  { value: 'phonepe', label: 'PhonePe CSV', ready: true },
  { value: 'axis', label: 'Axis Bank CSV', ready: false },
  { value: 'sbi', label: 'SBI CSV', ready: false },
  { value: 'card', label: 'Credit card CSV', ready: false },
]

const statusLabel: Record<PreviewStatus, string> = { new: 'New', duplicate: 'Duplicate', needs_review: 'Needs review' }

export default function Import() {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  if (result) return <ImportDone result={result} onAgain={() => setResult(null)} />
  if (preview)
    return (
      <PreviewStep
        preview={preview}
        onCancel={() => setPreview(null)}
        onConfirmed={(r) => {
          setPreview(null)
          setResult(r)
        }}
      />
    )
  return <PickStep onPreview={setPreview} />
}

function PickStep({ onPreview }: { onPreview: (p: ImportPreview) => void }) {
  const fileId = useId()
  const [parser, setParser] = useState<Source>('phonepe')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onPreview(await previewImport(file, parser))
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not read that file.')
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Import" />
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Statement type</Label>
          <Select value={parser} onValueChange={(v) => setParser(v as Source)}>
            <SelectTrigger aria-label="Statement type" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parsers.map((p) => (
                <SelectItem key={p.value} value={p.value} disabled={!p.ready}>
                  {p.label}
                  {!p.ready && ' · coming later'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">File</span>
          <label
            htmlFor={fileId}
            className={cn(
              'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-border bg-surface px-6 py-8 text-center transition-colors hover:border-accent/50 focus-within:border-accent',
              file && 'border-solid border-accent/60',
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              {file ? <FileText className="size-6" /> : <FileUp className="size-6" />}
            </span>
            {file ? (
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold break-all">{file.name}</span>
                <span className="text-[13px] text-muted">{(file.size / 1024).toFixed(1)} KB · tap to change</span>
              </span>
            ) : (
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">Choose a CSV file</span>
                <span className="text-[13px] text-muted">Nothing is saved until you confirm</span>
              </span>
            )}
            <input
              id={fileId}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setError(null)
              }}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm font-medium text-danger">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={!file || busy}>
          {busy ? 'Reading file…' : 'Preview'}
        </Button>
      </form>
    </>
  )
}

function PreviewStep({
  preview,
  onCancel,
  onConfirmed,
}: {
  preview: ImportPreview
  onCancel: () => void
  onConfirmed: (r: ImportResult) => void
}) {
  const cats = useCategories()
  const [filter, setFilter] = useState<PreviewStatus | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toSave = preview.counts.new + preview.counts.needsReview
  const rows = preview.rows.filter((r) => filter === 'all' || r.status === filter)

  const tiles: { key: PreviewStatus; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: preview.counts.new },
    { key: 'duplicate', label: 'Duplicate', count: preview.counts.duplicate },
    { key: 'needs_review', label: 'Needs review', count: preview.counts.needsReview },
  ]

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      onConfirmed(await confirmImport(preview.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Preview">
        <Button variant="link" className="px-1" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-1">
        <p className="text-[15px] font-semibold break-all">{preview.fileName}</p>
        <p className="text-[13px] text-muted">
          {sourceLabel[preview.parser]} · {preview.rows.length} rows · SHA-256 {preview.fileSha256.slice(0, 12)}…
        </p>
      </div>

      {preview.previouslyImportedAt && (
        <div role="status" className="mb-4 flex gap-3 rounded-[14px] border border-border bg-surface p-4 text-sm">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-accent" />
          <p>
            <span className="font-semibold">This exact file was imported on {formatDay(preview.previouslyImportedAt)}.</span>{' '}
            <span className="text-muted">Every row is a duplicate, so confirming adds nothing.</span>
          </p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label="Filter rows">
        {tiles.map((t) => {
          const on = filter === t.key
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on ? 'all' : t.key)}
              className={cn(
                'flex min-h-11 cursor-pointer flex-col items-start gap-0.5 rounded-[14px] border border-border bg-surface px-3.5 py-3 text-left transition-colors',
                on && 'border-accent bg-accent-soft',
              )}
            >
              <span className="text-2xl font-bold tracking-tight">{t.count}</span>
              <span className="text-xs text-muted">{t.label}</span>
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {rows.map((r, i) => (
            <li key={r.rowNumber} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border', r.status === 'duplicate' && 'opacity-60')}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{r.payee}</span>
                <span className="truncate text-[13px] text-muted">
                  {formatDay(r.date)} ·{' '}
                  {r.status === 'needs_review' ? 'You decide' : r.type === 'expense' || r.type === 'income' ? cats.name(r.categoryId) : r.type ? typeLabel[r.type] : ''}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Amount paise={r.amountPaise} direction={r.direction} type={r.type ?? undefined} className="text-[15px]" />
                <Badge variant={r.status === 'new' ? 'soft' : r.status === 'needs_review' ? 'secondary' : 'outline'}>{statusLabel[r.status]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Sticky confirm bar: sits above the bottom nav on phones */}
      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 -mx-5 mt-4 bg-gradient-to-t from-bg via-bg to-bg/0 px-5 pt-6 pb-2 md:bottom-0 md:-mx-10 md:px-10 md:pb-6">
        {error && (
          <p role="alert" className="mb-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button size="lg" className="w-full" disabled={busy || toSave === 0} onClick={confirm}>
          {busy ? 'Importing…' : toSave === 0 ? 'Nothing new to import' : `Import ${toSave} transaction${toSave > 1 ? 's' : ''}`}
        </Button>
      </div>
    </>
  )
}

function ImportDone({ result, onAgain }: { result: ImportResult; onAgain: () => void }) {
  return (
    <>
      <PageHeader title="Import" />
      <Card className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <CircleCheck className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold tracking-tight">Imported {result.inserted}</p>
          <p className="text-sm text-muted">
            {result.skippedDuplicates} duplicate{result.skippedDuplicates === 1 ? '' : 's'} skipped · {result.sentToReview} sent to review
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {result.sentToReview > 0 && (
            <Button asChild size="lg">
              <Link to="/review">Review {result.sentToReview} now</Link>
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={onAgain}>
            Import another file
          </Button>
        </div>
      </Card>
    </>
  )
}
