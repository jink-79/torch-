import { Router } from 'express'
import { z } from 'zod'

import type { Env } from '../config/env.js'
import { User } from '../models/User.js'
import { burnVerify, hashPassword, needsRehash, PASSWORD_MAX_LENGTH, verifyPassword } from './password.js'
import { loginLimiters } from './middleware.js'
import { clearCookieOptions, cookieName, cookieOptions, signSession } from './session.js'

const loginBody = z.object({
  username: z.string().trim().toLowerCase().min(1).max(40),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

/** The only route reachable without a session. There is deliberately no register route. */
export function publicAuthRouter(env: Env) {
  const router = Router()

  router.post('/login', ...loginLimiters(), async (req, res) => {
    const parsed = loginBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' })
      return
    }
    const { username, password } = parsed.data

    const user = await User.findOne({ username }).select('+passwordHash')
    const ok = user ? await verifyPassword(user.passwordHash, password) : await burnVerify(password)
    if (!user || !ok) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Wrong username or password.' })
      return
    }

    if (needsRehash(user.passwordHash)) {
      user.passwordHash = await hashPassword(password)
      await user.save()
    }

    const token = signSession({ sub: String(user._id), ver: user.tokenVersion }, env.JWT_SECRET, env.SESSION_HOURS)
    res.cookie(cookieName(env), token, cookieOptions(env))
    res.json({ username: user.username })
  })

  return router
}

/** Mounted after requireAuth. */
export function privateAuthRouter(env: Env) {
  const router = Router()

  router.get('/me', (req, res) => {
    res.json({ username: req.user!.username })
  })

  router.post('/logout', (_req, res) => {
    res.clearCookie(cookieName(env), clearCookieOptions(env))
    res.status(204).end()
  })

  return router
}
