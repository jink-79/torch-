import type { CookieOptions } from 'express'
import jwt from 'jsonwebtoken'

import { isProd, type Env } from '../config/env.js'

export interface SessionClaims {
  /** User id */
  sub: string
  /** User.tokenVersion at sign-in */
  ver: number
}

const ISSUER = 'torch'

export function signSession(claims: SessionClaims, secret: string, hours: number): string {
  return jwt.sign({ ver: claims.ver }, secret, {
    subject: claims.sub,
    algorithm: 'HS256',
    expiresIn: hours * 3600,
    issuer: ISSUER,
    audience: ISSUER,
  })
}

/** Returns null for anything that isn't a valid, unexpired token we issued. Only HS256 is accepted. */
export function verifySession(token: string, secret: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER, audience: ISSUER })
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null
    return { sub: payload.sub, ver: payload.ver }
  } catch {
    return null
  }
}

/**
 * Production uses the __Host- prefix: the browser only accepts it with Secure, Path=/ and no Domain,
 * so it can't be set by or leaked to any other subdomain. Plain name in dev because localhost is http.
 */
export function cookieName(env: Env) {
  return isProd(env) ? '__Host-torch_session' : 'torch_session'
}

export function cookieOptions(env: Env): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd(env),
    sameSite: 'strict',
    path: '/',
    maxAge: env.SESSION_HOURS * 3600 * 1000,
  }
}

export function clearCookieOptions(env: Env): CookieOptions {
  const { maxAge: _ignored, ...rest } = cookieOptions(env)
  return rest
}
