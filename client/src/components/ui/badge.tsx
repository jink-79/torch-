import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-accent text-on-accent',
        soft: 'bg-accent-soft text-text',
        secondary: 'bg-surface-2 text-text',
        outline: 'border border-border text-muted font-medium',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
)

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
