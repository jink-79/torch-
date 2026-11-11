import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold transition-[color,background-color,box-shadow,opacity] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'bg-accent text-on-accent hover:bg-accent/90 active:bg-accent/85',
        outline: 'border border-border bg-surface text-text hover:bg-surface-2',
        secondary: 'bg-surface-2 text-text hover:bg-surface-2/70',
        ghost: 'text-text hover:bg-surface-2',
        link: 'text-accent underline-offset-4 hover:underline',
        destructive: 'bg-danger text-white hover:bg-danger/90',
      },
      size: {
        // 44px minimum everywhere: these are tap targets on a phone.
        default: 'h-11 px-4',
        lg: 'h-13 px-5 text-base rounded-2xl',
        sm: 'h-11 px-3 text-sm',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
