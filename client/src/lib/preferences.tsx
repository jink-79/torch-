import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { getPreferences, updatePreferences } from './api'
import { applyTheme, syncThemeColor, watchSystemTheme } from './theme'
import type { Preferences } from './types'

interface PreferencesValue {
  prefs: Preferences | null
  /** Optimistic: the UI changes immediately, then the change is saved. */
  update: (patch: (p: Preferences) => Preferences) => void
}

const PreferencesContext = createContext<PreferencesValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [prefs, setPrefs] = useState<Preferences | null>(null)

  useEffect(() => {
    if (status !== 'authed') {
      setPrefs(null)
      return
    }
    getPreferences().then(setPrefs)
  }, [status])

  // Theme: apply on load/change; while on "system", follow iOS light/dark switches.
  const theme = prefs?.theme
  useEffect(() => {
    if (!theme) return
    applyTheme(theme)
    if (theme === 'system') return watchSystemTheme(syncThemeColor)
  }, [theme])

  const update = useCallback((patch: (p: Preferences) => Preferences) => {
    setPrefs((current) => {
      if (!current) return current
      const next = patch(current)
      void updatePreferences(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ prefs, update }), [prefs, update])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>')
  return ctx
}

/** First letter of the display name (or username), uppercased. Handles non-Latin scripts. */
export function initialOf(name: string | null | undefined): string {
  const first = [...(name ?? '').trim()][0]
  return first ? first.toLocaleUpperCase() : ''
}
