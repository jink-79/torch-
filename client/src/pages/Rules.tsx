import { useState } from 'react'
import { Pencil, Trash2, Wand2 } from 'lucide-react'

import { EmptyState, PageHeader, SegmentedControl, Skeleton, needsCategory, sourceLabel, typeLabel } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { deleteRule, listRules, updateRule } from '@/lib/api'
import { useApi, useCategories } from '@/lib/hooks'
import { formatPaise, paiseToInput, parseRupeesToPaise } from '@/lib/money'
import type { MatchKind, Rule, Source, TxnType } from '@/lib/types'

const matchLabel: Record<MatchKind, string> = { contains: 'contains', startsWith: 'starts with', exact: 'is exactly' }

/** Mirrors the engine's evaluation order so the list reads top-to-bottom the way rules are applied. */
function stageOf(r: Rule): 0 | 1 | 2 {
  if (r.type === 'transfer' || r.type === 'ignore') return 0
  if (r.matchKind === 'contains') return 2
  return 1
}
const stageTitles = ['Transfers and ignored', 'Specific merchants and payees', 'Generic patterns']

type OriginFilter = 'all' | 'seed' | 'learned'

export default function Rules() {
  const { data } = useApi(listRules, [])
  const cats = useCategories()
  const [origin, setOrigin] = useState<OriginFilter>('all')
  const [editing, setEditing] = useState<Rule | null>(null)
  const [deleting, setDeleting] = useState<Rule | null>(null)

  const rules = (data ?? []).filter((r) => origin === 'all' || r.origin === origin)
  const stages = [0, 1, 2].map((s) => rules.filter((r) => stageOf(r) === s))

  return (
    <>
      <PageHeader title="Rules" />

      <SegmentedControl<OriginFilter>
        label="Show"
        value={origin}
        onChange={setOrigin}
        className="mb-5"
        options={[
          { value: 'all', label: 'All' },
          { value: 'seed', label: 'Seed' },
          { value: 'learned', label: 'Learned' },
        ]}
      />

      {!data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState icon={<Wand2 className="size-6" />} title={origin === 'learned' ? 'No learned rules yet' : 'No rules'}>
          {origin === 'learned' && 'When you categorise something in Review and say “Yes, create rule”, it shows up here.'}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {stages.map((list, s) =>
            list.length === 0 ? null : (
              <section key={s} aria-labelledby={`stage-${s}`}>
                <h2 id={`stage-${s}`} className="mb-2 text-[13px] font-semibold text-muted">
                  {s + 1}. {stageTitles[s]}
                </h2>
                <ul className="flex flex-col gap-2">
                  {list.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-[18px] border border-border bg-surface py-3 pr-2 pl-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-[15px]">
                          <span className="text-muted">{matchLabel[r.matchKind]} </span>
                          <span className="font-semibold break-all">“{r.pattern}”</span>
                        </p>
                        <p className="text-[13px] text-muted">
                          → <span className="font-medium text-text">{needsCategory(r.type) ? `${typeLabel[r.type]} · ${cats.name(r.categoryId)}` : typeLabel[r.type]}</span>
                          {(r.minPaise !== null || r.maxPaise !== null) && ` · ${rangeText(r)}`}
                          {r.source && ` · ${sourceLabel[r.source]} only`}
                        </p>
                        <div className="flex gap-1.5 pt-0.5">
                          <Badge variant={r.origin === 'learned' ? 'soft' : 'secondary'}>{r.origin === 'learned' ? 'Learned' : 'Seed'}</Badge>
                          <Badge variant="outline">Priority {r.priority}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={`Edit rule ${r.pattern}`} onClick={() => setEditing(r)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete rule ${r.pattern}`} onClick={() => setDeleting(r)} className="text-muted hover:text-danger">
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent showClose aria-describedby={undefined}>
          {editing && <RuleEditor key={editing.id} rule={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <Sheet open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete this rule?</SheetTitle>
            <SheetDescription>
              “{deleting?.pattern}” will stop matching new imports. Transactions it already categorised keep their category.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button
              size="lg"
              variant="destructive"
              onClick={async () => {
                if (deleting) await deleteRule(deleting.id)
                setDeleting(null)
              }}
            >
              Delete rule
            </Button>
            <Button size="lg" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function rangeText(r: Rule) {
  if (r.minPaise !== null && r.maxPaise !== null) return `${formatPaise(r.minPaise)}–${formatPaise(r.maxPaise)}`
  if (r.minPaise !== null) return `≥ ${formatPaise(r.minPaise)}`
  return `≤ ${formatPaise(r.maxPaise ?? 0)}`
}

function RuleEditor({ rule, onDone }: { rule: Rule; onDone: () => void }) {
  const cats = useCategories()
  const [matchKind, setMatchKind] = useState<MatchKind>(rule.matchKind)
  const [pattern, setPattern] = useState(rule.pattern)
  const [type, setType] = useState<TxnType>(rule.type)
  const [categoryId, setCategoryId] = useState<string | null>(rule.categoryId)
  const [source, setSource] = useState<Source | 'any'>(rule.source ?? 'any')
  const [min, setMin] = useState(paiseToInput(rule.minPaise))
  const [max, setMax] = useState(paiseToInput(rule.maxPaise))
  const [priority, setPriority] = useState(String(rule.priority))
  const [saving, setSaving] = useState(false)

  const minPaise = parseRupeesToPaise(min)
  const maxPaise = parseRupeesToPaise(max)
  const prio = /^\d{1,4}$/.test(priority) ? Number(priority) : Number.NaN
  const errors = {
    pattern: pattern.trim() === '' ? 'Required' : null,
    category: needsCategory(type) && !categoryId ? 'Pick a category' : null,
    min: Number.isNaN(minPaise) ? 'Use a number like 250 or 99.50' : null,
    max: Number.isNaN(maxPaise) ? 'Use a number like 250 or 99.50' : maxPaise !== null && minPaise !== null && maxPaise < minPaise ? 'Must be above the minimum' : null,
    priority: Number.isNaN(prio) ? 'Whole number' : null,
  }
  const valid = Object.values(errors).every((e) => e === null)

  async function save() {
    setSaving(true)
    await updateRule({
      ...rule,
      matchKind,
      pattern,
      type,
      categoryId: needsCategory(type) ? categoryId : null,
      source: source === 'any' ? null : source,
      minPaise,
      maxPaise,
      priority: prio,
    })
    onDone()
  }

  return (
    <>
      <SheetHeader className="pr-10">
        <SheetTitle>Edit rule</SheetTitle>
      </SheetHeader>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
        <div className="flex flex-col gap-2">
          <Label>Match</Label>
          <Select value={matchKind} onValueChange={(v) => setMatchKind(v as MatchKind)}>
            <SelectTrigger aria-label="Match kind" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="startsWith">Starts with</SelectItem>
              <SelectItem value="exact">Exactly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field id="pattern" label="Text" error={errors.pattern}>
          <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} autoCapitalize="characters" className="uppercase" />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Becomes</Label>
        <SegmentedControl<TxnType>
          label="Type"
          value={type}
          onChange={(t) => {
            setType(t)
            if (!needsCategory(t)) setCategoryId(null)
          }}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
            { value: 'transfer', label: 'Transfer' },
            { value: 'ignore', label: 'Ignore' },
          ]}
        />
      </div>

      {needsCategory(type) && (
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select value={categoryId ?? undefined} onValueChange={setCategoryId}>
            <SelectTrigger aria-label="Category" className="h-12" aria-invalid={errors.category ? true : undefined}>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              {cats.list.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field id="min" label="Min ₹ (optional)" error={errors.min}>
          <Input id="min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
        </Field>
        <Field id="max" label="Max ₹ (optional)" error={errors.max}>
          <Input id="max" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label>Source</Label>
          <Select value={source} onValueChange={(v) => setSource(v as Source | 'any')}>
            <SelectTrigger aria-label="Source" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any source</SelectItem>
              {(Object.keys(sourceLabel) as Source[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {sourceLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field id="priority" label="Priority" error={errors.priority}>
          <Input id="priority" inputMode="numeric" value={priority} onChange={(e) => setPriority(e.target.value)} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">Lower priority numbers are checked first within each stage.</p>

      <SheetFooter>
        <Button size="lg" disabled={!valid || saving} onClick={save}>
          Save rule
        </Button>
      </SheetFooter>
    </>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error: string | null; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  )
}
