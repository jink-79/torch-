import type { ThemePreference } from './types'

/** Read by the inline script in index.html before first paint, so there is no light flash in dark mode. */
export const THEME_STORAGE_KEY = 'torch.theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return darkQuery().matches ? 'dark' : 'light'
  return pref
}

/** Sets <html data-theme>, remembers the choice on this device and recolours the iOS status bar. */
export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement
  if (pref === 'system') delete root.dataset.theme
  else root.dataset.theme = pref
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    /* private mode: theme still applies for this session */
  }
  syncThemeColor()
}

/** <meta name="theme-color"> tints the iPhone status bar in Home Screen mode; keep it equal to --bg. */
export function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && bg) meta.content = bg
}

/** While following the system, re-sync when iOS switches between light and dark. */
export function watchSystemTheme(onChange: () => void) {
  const q = darkQuery()
  q.addEventListener('change', onChange)
  return () => q.removeEventListener('change', onChange)
}
