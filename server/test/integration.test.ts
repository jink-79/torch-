/**
 * End-to-end auth against a real MongoDB. Skipped unless TEST_MONGODB_URI is set, e.g.:
 *   TEST_MONGODB_URI='mongodb+srv://…' npm test -w server
 * Uses a throwaway database (torch_test_<random>) and drops it afterwards; never touches the real one.
 */
import { randomBytes } from 'node:crypto'

import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { hashPassword } from '../src/auth/password.js'
import { User } from '../src/models/User.js'
import { startApp, testEnv } from './helpers.js'

const uri = process.env.TEST_MONGODB_URI

describe.skipIf(!uri)('auth against a real database', () => {
  const dbName = `torch_test_${randomBytes(4).toString('hex')}`
  const password = 'synthetic-password-for-tests'
  let app: Awaited<ReturnType<typeof startApp>>

  beforeAll(async () => {
    await mongoose.connect(uri!, { dbName, serverSelectionTimeoutMS: 10_000 })
    await User.init()
    await User.create({ username: 'owner', passwordHash: await hashPassword(password) })
    app = await startApp(testEnv())
  }, 30_000)

  afterAll(async () => {
    await app?.close()
    if (mongoose.connection.readyState === 1) {
      expect(mongoose.connection.name).toBe(dbName) // safety: only ever drop the throwaway database
      await mongoose.connection.dropDatabase()
    }
    await mongoose.disconnect()
  })

  const login = (username: string, pw: string) =>
    fetch(`${app.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password: pw }),
    })
  const cookieFrom = (res: Response) => res.headers.get('set-cookie')!.split(';')[0]

  it('wrong password and unknown user give the same 401', async () => {
    const a = await login('owner', 'wrong-password-123')
    const b = await login('nobody', 'wrong-password-123')
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(await a.json()).toEqual(await b.json())
  })

  it('signs in, sets an httpOnly strict cookie, and /me works', async () => {
    const res = await login('OWNER', password) // usernames are case-insensitive
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')!
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Strict/i)

    const me = await fetch(`${app.base}/api/auth/me`, { headers: { cookie: cookieFrom(res) } })
    expect(me.status).toBe(200)
    expect(await me.json()).toEqual({ username: 'owner' })
  })

  it('a second user is impossible at the database level', async () => {
    await expect(User.create({ username: 'intruder', passwordHash: 'x' })).rejects.toMatchObject({ code: 11000 })
  })

  it('bumping tokenVersion signs out existing sessions', async () => {
    const cookie = cookieFrom(await login('owner', password))
    await User.updateOne({}, { $inc: { tokenVersion: 1 } })
    const me = await fetch(`${app.base}/api/auth/me`, { headers: { cookie } })
    expect(me.status).toBe(401)
  })

  it('logout clears the cookie', async () => {
    const cookie = cookieFrom(await login('owner', password))
    const res = await fetch(`${app.base}/api/auth/logout`, { method: 'POST', headers: { cookie } })
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toMatch(/torch_session=;/)
  })
})
