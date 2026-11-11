/**
 * Vercel serverless entry. `api/index.js` re-exports this; vercel.json rewrites /api/* to it, and Express
 * routes on the original path. The app and the database connection are created once per warm instance
 * and reused across requests.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { connectDb } from './db/connect.js'

type Handler = ReturnType<typeof createApp>

let ready: Promise<Handler> | undefined

async function init(): Promise<Handler> {
  const vercelHost = (name: string) => (process.env[name] ? `https://${process.env[name]}` : undefined)
  const env = loadEnv({
    // Vercel's edge sits in front of every function: one proxy hop, so req.ip is the real client IP.
    TRUST_PROXY: '1',
    // Default to the project's production domain so APP_ORIGIN only needs setting for a custom domain.
    APP_ORIGIN: vercelHost('VERCEL_PROJECT_PRODUCTION_URL'),
    ...process.env,
  })
  // Few connections per instance: there can be many instances, and Atlas free tier caps connections.
  await connectDb(env.MONGODB_URI, { maxPoolSize: 3 })
  const extra = [vercelHost('VERCEL_URL'), vercelHost('VERCEL_BRANCH_URL')].filter((o): o is string => Boolean(o))
  return createApp(env, { persistentRateLimits: true, extraOrigins: extra })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= init()
  let app: Handler
  try {
    app = await ready
  } catch (err) {
    ready = undefined // retry on the next request instead of caching the failure
    console.error('[init] failed:', (err as Error).message)
    res.statusCode = 503
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify({ error: 'unavailable' }))
    return
  }
  app(req, res)
}
