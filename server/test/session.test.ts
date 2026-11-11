import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'

import { signSession, verifySession } from '../src/auth/session.js'

const secret = 'test-secret-test-secret-test-secret-0123456789'
const claims = { sub: '65f000000000000000000001', ver: 3 }

describe('session tokens', () => {
  it('round-trips claims', () => {
    expect(verifySession(signSession(claims, secret, 1), secret)).toEqual(claims)
  })

  it('rejects a token signed with another secret', () => {
    expect(verifySession(signSession(claims, 'another-secret-another-secret-0123', 1), secret)).toBeNull()
  })

  it('rejects alg=none', () => {
    const unsigned = jwt.sign({ ver: 3 }, '', { algorithm: 'none', subject: claims.sub, issuer: 'torch', audience: 'torch' })
    expect(verifySession(unsigned, secret)).toBeNull()
  })

  it('rejects an expired token', () => {
    const expired = jwt.sign({ ver: 3, exp: Math.floor(Date.now() / 1000) - 10 }, secret, {
      algorithm: 'HS256',
      subject: claims.sub,
      issuer: 'torch',
      audience: 'torch',
    })
    expect(verifySession(expired, secret)).toBeNull()
  })

  it('rejects a tampered payload', () => {
    const [h, , s] = signSession(claims, secret, 1).split('.')
    const forged = Buffer.from(JSON.stringify({ sub: claims.sub, ver: 99, iss: 'torch', aud: 'torch' })).toString('base64url')
    expect(verifySession(`${h}.${forged}.${s}`, secret)).toBeNull()
  })

  it('rejects tokens from another issuer', () => {
    const other = jwt.sign({ ver: 3 }, secret, { algorithm: 'HS256', subject: claims.sub, issuer: 'other', audience: 'torch' })
    expect(verifySession(other, secret)).toBeNull()
  })

  it('rejects garbage', () => {
    expect(verifySession('not-a-jwt', secret)).toBeNull()
  })
})
