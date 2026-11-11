import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import cookieParser from 'cookie-parser'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'

import { checkOrigin, requireAuth } from './auth/middleware.js'
import { privateAuthRouter, publicAuthRouter } from './auth/routes.js'
import { isProd, type Env } from './config/env.js'

const CLIENT_DIST = path.resolve(import.meta.dirname, '../../client/dist')

export interface AppOptions {
  /** Keep login rate-limit counters in MongoDB (needed on serverless). Defaults to true in production. */
  persistentRateLimits?: boolean
  /** More origins allowed to send state-changing requests, e.g. the current Vercel deployment URL. */
  extraOrigins?: string[]
}

export function createApp(env: Env, options: AppOptions = {}) {
  const persistentRateLimits = options.persistentRateLimits ?? isProd(env)
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', env.TRUST_PROXY)

  app.use(helmet({ contentSecurityPolicy: { directives: cspDirectives(env) } }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  // ---- API -------------------------------------------------------------------------------
  const api = express.Router()
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  api.use(checkOrigin(env, options.extraOrigins))

  // Public: sign-in only.
  api.use('/auth', publicAuthRouter(env, persistentRateLimits))

  // Everything below needs a session, including unknown paths (they answer 401, not 404).
  api.use(requireAuth(env))
  api.use('/auth', privateAuthRouter(env))
  // Phase 2+: /transactions, /rules, /categories, /imports, /dashboard

  api.use((_req, res) => {
    res.status(404).json({ error: 'not_found' })
  })
  app.use('/api', api)

  // ---- Optional: serve the built client from the same origin -----------------------------
  if (env.SERVE_CLIENT) {
    if (!existsSync(path.join(CLIENT_DIST, 'index.html'))) {
      throw new Error(`SERVE_CLIENT=true but ${CLIENT_DIST}/index.html is missing. Run: npm run build -w client`)
    }
    app.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { immutable: true, maxAge: '1y', index: false }))
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }))
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache')
      res.sendFile(path.join(CLIENT_DIST, 'index.html'))
    })
  }

  app.use(errorHandler(env))
  return app
}

/**
 * CSP. The client's index.html has one small inline script (applies the theme before first paint);
 * allow exactly that script by hash instead of 'unsafe-inline'.
 */
function cspDirectives(env: Env) {
  const scriptSrc = ["'self'"]
  const indexHtml = path.join(CLIENT_DIST, 'index.html')
  if (env.SERVE_CLIENT && existsSync(indexHtml)) {
    const html = readFileSync(indexHtml, 'utf8')
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      scriptSrc.push(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
    }
  }
  return {
    defaultSrc: ["'self'"],
    scriptSrc,
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    manifestSrc: ["'self'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
  }
}

function errorHandler(env: Env): ErrorRequestHandler {
  return (err, req, res, _next) => {
    // Malformed or oversized JSON bodies from express.json()
    if (err?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'invalid_json' })
    if (err?.type === 'entity.too.large') return void res.status(413).json({ error: 'payload_too_large' })

    // Never log request bodies: they can contain passwords or statement data.
    console.error(`[error] ${req.method} ${req.path}:`, isProd(env) ? (err?.message ?? err) : err)
    if (res.headersSent) return
    res.status(500).json({ error: 'internal_error' })
  }
}
