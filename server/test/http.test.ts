import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { signSession } from '../src/auth/session.js'
import { startApp } from './helpers.js'

let app: Awaited<ReturnType<typeof startApp>>
beforeAll(async () => {
  app = await startApp()
})
afterAll(async () => {
  await app.close()
})

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

describe('every route except login requires a session', () => {
  it.each([
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/logout'],
    ['GET', '/api/transactions'],
    ['GET', '/api/does-not-exist'],
    ['POST', '/api/auth/register'],
  ])('%s %s → 401 without a cookie', async (method, path) => {
    const res = await fetch(app.base + path, { method })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthenticated' })
  })

  it('rejects a garbage cookie and clears it', async () => {
    const res = await fetch(`${app.base}/api/auth/me`, { headers: { cookie: 'torch_session=garbage' } })
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toMatch(/torch_session=;/)
  })

  it('rejects a token signed with the wrong secret', async () => {
    const token = signSession({ sub: '65f000000000000000000001', ver: 0 }, 'wrong-secret-wrong-secret-wrong-secret-0', 1)
    const res = await fetch(`${app.base}/api/auth/me`, { headers: { cookie: `torch_session=${token}` } })
    expect(res.status).toBe(401)
  })

  it('API responses are not cacheable', async () => {
    const res = await fetch(`${app.base}/api/auth/me`)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('login endpoint', () => {
  it('400 on a malformed body without touching the database', async () => {
    const res = await fetch(`${app.base}/api/auth/login`, json({ username: '' }))
    expect(res.status).toBe(400)
  })

  it('400 on invalid JSON', async () => {
    const res = await fetch(`${app.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_json' })
  })

  it('403 when a browser posts from a foreign origin', async () => {
    const res = await fetch(`${app.base}/api/auth/login`, {
      ...json({ username: 'a', password: 'b' }),
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    })
    expect(res.status).toBe(403)
  })

  it('rate-limits repeated failed attempts (10 per 15 min per IP)', async () => {
    const fresh = await startApp()
    try {
      const statuses: number[] = []
      for (let i = 0; i < 11; i++) {
        statuses.push((await fetch(`${fresh.base}/api/auth/login`, json({ username: '' }))).status)
      }
      expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true)
      expect(statuses[10]).toBe(429)
    } finally {
      await fresh.close()
    }
  })
})

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await fetch(`${app.base}/api/auth/me`)
    expect(res.headers.get('x-powered-by')).toBeNull()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
  })
})
