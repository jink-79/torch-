import type { AddressInfo } from 'node:net'

import { createApp } from '../src/app.js'
import { loadEnv, type Env } from '../src/config/env.js'

/** Synthetic config only; no real secrets or connection strings in tests. */
export function testEnv(overrides: Record<string, string> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://127.0.0.1:1/torch-test',
    JWT_SECRET: 'test-secret-test-secret-test-secret-0123456789',
    ...overrides,
  })
}

/** Starts the app on a random port. These tests never reach the database. */
export async function startApp(env = testEnv()) {
  const server = createApp(env).listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return {
    base,
    env,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
