import { Flame } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent', className)}
    >
      <Flame className="size-[58%]" strokeWidth={2.2} />
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Logo />
      <span className="text-lg font-semibold tracking-tight">Torch</span>
    </span>
  )
}
