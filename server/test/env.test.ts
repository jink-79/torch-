import { describe, expect, it } from 'vitest'

import { loadEnv } from '../src/config/env.js'

const ok = { MONGODB_URI: 'mongodb+srv://u:p@example.mongodb.net/torch', JWT_SECRET: 'x'.repeat(32) }

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv(ok)
    expect(env.PORT).toBe(4000)
    expect(env.SESSION_HOURS).toBe(168)
    expect(env.SERVE_CLIENT).toBe(false)
  })

  it('rejects a short JWT secret', () => {
    expect(() => loadEnv({ ...ok, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/)
  })

  it('rejects a non-mongodb URI', () => {
    expect(() => loadEnv({ ...ok, MONGODB_URI: 'https://example.com' })).toThrow(/MONGODB_URI/)
  })

  it('requires APP_ORIGIN in production', () => {
    expect(() => loadEnv({ ...ok, NODE_ENV: 'production' })).toThrow(/APP_ORIGIN/)
    expect(loadEnv({ ...ok, NODE_ENV: 'production', APP_ORIGIN: 'https://torch.example.app' }).APP_ORIGIN).toBe(
      'https://torch.example.app',
    )
  })

  it('never includes values in the error message', () => {
    try {
      loadEnv({ ...ok, JWT_SECRET: 'leakme' })
    } catch (e) {
      expect((e as Error).message).not.toContain('leakme')
    }
  })
})
