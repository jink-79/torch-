import { useState, type ReactNode } from 'react'
import { Bell, CalendarClock, ChevronRight, Info, LogOut, Monitor, Moon, SlidersHorizontal, Sun } from 'lucide-react'
import { Link } from 'react-router'

import { useAuth } from '@/auth/AuthProvider'
import { Avatar } from '@/components/Avatar'
import { PageHeader, SegmentedControl, Skeleton } from '@/components/common'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatTime, formatWeekday, nextScheduled } from '@/lib/dates'
import { usePreferences } from '@/lib/preferences'
import type { ImportFrequency, Preferences, ThemePreference } from '@/lib/types'
import { cn } from '@/lib/utils'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const hours = [7, 9, 10, 12, 18, 20, 21]
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'am' : 'pm'}`
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`

export default function Account() {
  const { prefs, update } = usePreferences()
  const { username, logout } = useAuth()

  if (!prefs) {
    return (
      <>
        <PageHeader title="Account" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </>
    )
  }

  const set = (fn: (p: Preferences) => Preferences) => update(fn)
  const next = prefs.notifications.importReminders ? nextScheduled(prefs.importSchedule) : null

  return (
    <>
      <PageHeader title="Account" />

      <div className="flex flex-col gap-7">
        {/* Profile */}
        <section aria-label="Profile" className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-4">
          <Avatar className="size-16 text-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <NameField value={prefs.displayName} onSave={(displayName) => set((p) => ({ ...p, displayName }))} />
            <span className="truncate pl-1 text-[13px] text-muted">Signed in as {username}</span>
          </div>
        </section>

        <h2 className="-mb-4 px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">Preferences</h2>

        {/* Theme */}
        <Group icon={<Sun />} title="Theme">
          <div className="p-3">
            <ThemePicker value={prefs.theme} onChange={(theme) => set((p) => ({ ...p, theme }))} />
          </div>
        </Group>

        {/* Notifications */}
        <Group icon={<Bell />} title="Notifications" footer="Saved now. Reminders start arriving once the server is connected. On iPhone they need Torch added to the Home Screen.">
          <ToggleRow
            id="n-review"
            label="Review reminders"
            hint="When payments are waiting for a category"
            checked={prefs.notifications.reviewReminders}
            onChange={(v) => set((p) => ({ ...p, notifications: { ...p.notifications, reviewReminders: v } }))}
          />
          <ToggleRow
            id="n-import"
            label="Import reminders"
            hint="On the schedule below"
            checked={prefs.notifications.importReminders}
            onChange={(v) => set((p) => ({ ...p, notifications: { ...p.notifications, importReminders: v } }))}
          />
        </Group>

        {/* Import schedule */}
        <Group
          icon={<CalendarClock />}
          title="Import schedule"
          footer={
            prefs.importSchedule.frequency === 'off'
              ? 'No routine. Import whenever you like.'
              : next
                ? `Next reminder: ${formatWeekday(next)}, ${formatTime(next)}`
                : 'Turn on import reminders to be nudged on this schedule.'
          }
        >
          <div className="flex flex-col gap-3 p-3">
            <SegmentedControl<ImportFrequency>
              label="How often you import"
              value={prefs.importSchedule.frequency}
              onChange={(frequency) => set((p) => ({ ...p, importSchedule: { ...p.importSchedule, frequency } }))}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
            {prefs.importSchedule.frequency !== 'off' && (
              <div className="grid grid-cols-2 gap-2">
                {prefs.importSchedule.frequency === 'weekly' ? (
                  <Select
                    value={String(prefs.importSchedule.weekday)}
                    onValueChange={(v) => set((p) => ({ ...p, importSchedule: { ...p.importSchedule, weekday: Number(v) } }))}
                  >
                    <SelectTrigger aria-label="Day of the week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekdays.map((d, i) => (
                        <SelectItem key={d} value={String(i)}>
                          Every {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={String(prefs.importSchedule.dayOfMonth)}
                    onValueChange={(v) => set((p) => ({ ...p, importSchedule: { ...p.importSchedule, dayOfMonth: Number(v) } }))}
                  >
                    <SelectTrigger aria-label="Day of the month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          On the {ordinal(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={String(prefs.importSchedule.hour)}
                  onValueChange={(v) => set((p) => ({ ...p, importSchedule: { ...p.importSchedule, hour: Number(v) } }))}
                >
                  <SelectTrigger aria-label="Time of day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </Group>

        {/* More */}
        <Group title="More">
          <LinkRow to="/rules" icon={<SlidersHorizontal />} label="Rules" hint="How payments get categorised" />
          <button
            type="button"
            onClick={logout}
            className="flex min-h-13 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-danger hover:bg-surface-2/60"
          >
            <LogOut className="size-5" /> Sign out
          </button>
        </Group>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted">
          <Info className="size-3.5" /> Torch · preview build with sample data
        </p>
      </div>
    </>
  )
}

function Group({ icon, title, footer, children }: { icon?: ReactNode; title: string; footer?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 px-1 text-[15px] font-semibold [&_svg]:size-4 [&_svg]:text-muted">
        {icon}
        {title}
      </h3>
      <div className="overflow-hidden rounded-[18px] border border-border bg-surface [&>*+*]:border-t [&>*+*]:border-border">{children}</div>
      {footer && <p className="px-1 text-[13px] leading-relaxed text-muted">{footer}</p>}
    </section>
  )
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-15 cursor-pointer items-center gap-3 px-4 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="text-[13px] text-muted">{hint}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function LinkRow({ to, icon, label, hint }: { to: string; icon: ReactNode; label: string; hint: string }) {
  return (
    <Link to={to} className="flex min-h-15 items-center gap-3 px-4 py-3 hover:bg-surface-2/60 [&>svg:first-child]:size-5 [&>svg:first-child]:text-muted">
      {icon}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="text-[13px] text-muted">{hint}</span>
      </span>
      <ChevronRight className="size-5 text-muted" />
    </Link>
  )
}

const themeOptions: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: 'system', label: 'System', icon: <Monitor /> },
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
]

function ThemePicker({ value, onChange }: { value: ThemePreference; onChange: (v: ThemePreference) => void }) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
      {themeOptions.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-border bg-bg text-sm font-medium text-muted transition-colors [&_svg]:size-5',
              on && 'border-accent bg-accent-soft font-semibold text-text [&_svg]:text-accent',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function NameField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  const commit = () => {
    const v = draft.trim()
    if (v && v !== value) onSave(v)
    else setDraft(value)
  }
  return (
    <Input
      aria-label="Your name"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      maxLength={40}
      enterKeyHint="done"
      autoComplete="given-name"
      className="h-11 border-transparent bg-transparent px-1 text-lg font-semibold hover:border-border focus-visible:border-ring focus-visible:bg-surface"
    />
  )
}
