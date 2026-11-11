import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CircleAlert, Eye, EyeOff, FileCheck2, Lock, ShieldCheck, Shuffle, User } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/auth/AuthProvider'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'authed') return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh md:items-stretch">
      {/* Brand panel: desktop only */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-accent p-12 text-on-accent md:flex">
        <Rings className="-right-40 -bottom-40 text-on-accent/10" />
        <div className="flex items-center gap-3">
          <Logo className="size-10 rounded-xl bg-on-accent text-accent" />
          <span className="text-xl font-semibold tracking-tight">Torch</span>
        </div>
        <div className="relative flex flex-col gap-8">
          <h2 className="max-w-sm text-4xl leading-tight font-bold tracking-tight">Every rupee, accounted for.</h2>
          <ul className="flex flex-col gap-4 text-[15px] text-on-accent/85">
            <Point icon={<FileCheck2 />}>PhonePe, bank and card statements in one place</Point>
            <Point icon={<Shuffle />}>Card bills and self-transfers never count as spending</Point>
            <Point icon={<ShieldCheck />}>Nothing is saved until you confirm the preview</Point>
          </ul>
        </div>
        <p className="relative text-sm text-on-accent/70">Private, single-user app.</p>
      </aside>

      {/* Form */}
      <main className="relative flex flex-1 flex-col overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
          {/* Mobile brand */}
          <div className="relative flex flex-col items-center gap-5 pt-6 text-center md:hidden">
            <Rings className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-[62%] text-accent/10" />
            <Logo className="relative size-20 rounded-[26px] shadow-[0_10px_30px_-8px_rgb(15_110_116/0.55)] ring-8 ring-accent-soft" />
            <div className="relative flex flex-col gap-1.5">
              <h1 className="text-[28px] font-bold tracking-tight">Welcome back</h1>
              <p className="text-[15px] text-muted">Sign in to Torch</p>
            </div>
          </div>
          <div className="hidden flex-col gap-1.5 md:flex">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-[15px] text-muted">Sign in to continue to Torch.</p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="relative flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(15_26_32/0.12)] md:border-0 md:bg-transparent md:p-0 md:shadow-none"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <IconField icon={<User />}>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11"
                  required
                />
              </IconField>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <IconField icon={<Lock />}>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="pr-12 pl-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-0.5 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </IconField>
            </div>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-danger/8 px-3 py-2.5 text-sm font-medium text-danger"
              >
                <CircleAlert className="mt-px size-4 shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
              {busy ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-on-accent/40 border-t-on-accent" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mx-auto flex items-center gap-1.5 pt-6 text-xs text-muted md:hidden">
          <ShieldCheck className="size-3.5" /> Private, single-user app
        </p>
      </main>
    </div>
  )
}

function IconField({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted [&_svg]:size-[18px]">
        {icon}
      </span>
      {children}
    </div>
  )
}

function Point({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-on-accent/12 [&_svg]:size-4">{icon}</span>
      <span className="pt-1">{children}</span>
    </li>
  )
}

/** Quiet concentric rings: the only decoration on the page. */
function Rings({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 400" className={cn('pointer-events-none absolute size-[400px]', className)} fill="none" stroke="currentColor">
      {[60, 100, 140, 180].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} strokeWidth="1.5" />
      ))}
    </svg>
  )
}
