import { describe, expect, it } from 'vitest'

import { burnVerify, hashPassword, needsRehash, verifyPassword } from '../src/auth/password.js'

describe('password hashing', () => {
  it('uses argon2id and verifies', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash.startsWith('$argon2id$')).toBe(true)
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true)
    expect(await verifyPassword(hash, 'wrong password')).toBe(false)
    expect(needsRehash(hash)).toBe(false)
  })

  it('salts: same password, different hashes', async () => {
    expect(await hashPassword('same password here')).not.toBe(await hashPassword('same password here'))
  })

  it('treats a malformed hash as a failed check, not a crash', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false)
  })

  it('burnVerify always fails', async () => {
    expect(await burnVerify('anything')).toBe(false)
  })
})
