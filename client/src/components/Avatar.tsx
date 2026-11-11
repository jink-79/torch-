import { User } from 'lucide-react'

import { useAuth } from '@/auth/AuthProvider'
import { initialOf, usePreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'

/** Initial-letter avatar for the signed-in user ("A" for Ajinkya). Falls back to a person icon. */
export function Avatar({ className, active = false }: { className?: string; active?: boolean }) {
  const { username } = useAuth()
  const { prefs } = usePreferences()
  const letter = initialOf(prefs?.displayName || username)

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent transition-shadow',
        active && 'bg-accent text-on-accent ring-2 ring-accent/30 ring-offset-2 ring-offset-surface',
        className,
      )}
    >
      {letter || <User className="size-[60%]" />}
    </span>
  )
}
