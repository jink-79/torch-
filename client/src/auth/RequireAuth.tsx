import { Navigate, Outlet, useLocation } from 'react-router'

import { Logo } from '@/components/Logo'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <Logo className="size-10 animate-pulse" />
      </div>
    )
  }
  if (status === 'anon') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
