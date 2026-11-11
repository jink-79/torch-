import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as api from '@/lib/api'

type Status = 'loading' | 'authed' | 'anon'

interface AuthValue {
  status: Status
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    api.me().then((u) => {
      setUsername(u?.username ?? null)
      setStatus(u ? 'authed' : 'anon')
    })
  }, [])

  const login = useCallback(async (u: string, p: string) => {
    const res = await api.login(u, p)
    setUsername(res.username)
    setStatus('authed')
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUsername(null)
    setStatus('anon')
  }, [])

  const value = useMemo(() => ({ status, username, login, logout }), [status, username, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
