import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { isValidObjectId } from 'mongoose'

import { isProd, type Env } from '../config/env.js'
import { User } from '../models/User.js'
import { clearCookieOptions, cookieName, verifySession } from './session.js'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string }
    }
  }
}

/** Every route mounted after this requires a valid session. Unknown routes also answer 401, so nothing leaks. */
export function requireAuth(env: Env): RequestHandler {
  const name = cookieName(env)
  return async (req, res, next) => {
    const token: unknown = req.cookies?.[name]
    const claims = typeof token === 'string' ? verifySession(token, env.JWT_SECRET) : null
    if (!claims || !isValidObjectId(claims.sub)) {
      if (token) res.clearCookie(name, clearCookieOptions(env))
      res.status(401).json({ error: 'unauthenticated' })
      return
    }
    const user = await User.findById(claims.sub).select('username tokenVersion').lean()
    if (!user || user.tokenVersion !== claims.ver) {
      res.clearCookie(name, clearCookieOptions(env))
      res.status(401).json({ error: 'unauthenticated' })
      return
    }
    req.user = { id: String(user._id), username: user.username }
    next()
  }
}

/**
 * CSRF defence in depth on top of SameSite=Strict: a browser always sends Origin on cross-site
 * state-changing requests, so reject any that don't come from the app.
 */
export function checkOrigin(env: Env): RequestHandler {
  const allowed = new Set<string>()
  if (env.APP_ORIGIN) allowed.add(new URL(env.APP_ORIGIN).origin)
  if (!isProd(env)) allowed.add('http://localhost:5173')
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()
    const origin = req.get('origin')
    if (origin && !allowed.has(origin)) {
      res.status(403).json({ error: 'forbidden_origin' })
      return
    }
    next()
  }
}

const tooMany: RequestHandler = (_req, res) => {
  res.status(429).json({ error: 'too_many_attempts', message: 'Too many sign-in attempts. Try again later.' })
}

/**
 * Two limits on failed sign-ins (successful ones don't count):
 *  - per IP: 10 per 15 minutes
 *  - overall: 30 per hour, so guessing spread across many IPs is also capped (single-user app).
 */
export function loginLimiters(): RequestHandler[] {
  const common = { standardHeaders: 'draft-8' as const, legacyHeaders: false, skipSuccessfulRequests: true, handler: tooMany }
  return [
    rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 10 }),
    rateLimit({ ...common, windowMs: 60 * 60 * 1000, limit: 30, keyGenerator: () => 'all-logins' }),
  ]
}
