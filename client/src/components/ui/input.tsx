import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // text-base (16px) stops iOS Safari from zooming in when the field is focused.
        'h-12 w-full min-w-0 rounded-xl border border-input bg-surface px-4 text-base text-text outline-none transition-[box-shadow,border-color] placeholder:text-muted',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50',
        'file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:text-sm file:font-medium file:text-text',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
