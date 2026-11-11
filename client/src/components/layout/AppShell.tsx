import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { useAuth } from '@/auth/AuthProvider'
import { Avatar } from '@/components/Avatar'
import { Wordmark } from '@/components/Logo'
import { getReviewCount } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { usePreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none text-on-accent',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function AppShell() {
  const { data: reviewCount = 0 } = useApi(getReviewCount, [])
  const { logout, username } = useAuth()
  const { prefs } = usePreferences()
  const name = prefs?.displayName || username || 'Account'
  const firstName = name.split(/\s+/)[0]

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar: md and up */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
        <Wordmark className="px-3 pb-6" />
        <nav aria-label="Main" className="flex flex-col gap-1">
          {navItems.filter((i) => i.in.includes('sidebar')).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text',
                  isActive && 'bg-accent-soft text-text hover:bg-accent-soft',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon && <item.icon className={cn('size-5', isActive && 'text-accent')} />}
                  <span className="flex-1">{item.label}</span>
                  {item.badge === 'review' && <CountBadge count={reviewCount} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-1 border-t border-border pt-3">
          <NavLink
            to="/account"
            className={({ isActive }) =>
              cn(
                'flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 hover:bg-surface-2',
                isActive && 'bg-accent-soft hover:bg-accent-soft',
              )
            }
          >
            <Avatar className="size-8 text-sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-xs text-muted">Preferences</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
            aria-label="Sign out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pt-[env(safe-area-inset-top)] pb-[calc(var(--nav-h)+1.5rem)] md:pb-12">
        <div className="mx-auto w-full max-w-xl px-5 md:max-w-3xl md:px-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav: phones */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface px-1 pt-1.5 pb-(--nav-pad-bottom) md:hidden"
      >
        {navItems.filter((i) => i.in.includes('bottom')).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            aria-label={item.icon ? undefined : 'Account'}
            className={({ isActive }) =>
              cn(
                'relative flex h-13 min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted',
                isActive && 'font-semibold text-accent',
              )
            }
          >
            {({ isActive }) =>
              item.icon ? (
                <>
                  <item.icon className="size-[22px]" />
                  {item.label}
                  {item.badge === 'review' && <CountBadge count={reviewCount} className="absolute top-0 left-1/2 ml-1.5" />}
                </>
              ) : (
                <>
                  <Avatar active={isActive} className="size-[24px] text-[12px]" />
                  <span className="max-w-full truncate px-1">{firstName}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
