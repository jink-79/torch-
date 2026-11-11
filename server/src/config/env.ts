import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters (generate with: openssl rand -base64 48)'),
  SESSION_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(24 * 7),
  APP_ORIGIN: z.url().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  SERVE_CLIENT: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

export type Env = z.infer<typeof schema>

/** Validates configuration once at startup. Fails loudly with every problem listed, never prints values. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    throw new Error(`Invalid environment:\n${lines.join('\n')}`)
  }
  const env = result.data
  if (env.NODE_ENV === 'production' && !env.APP_ORIGIN) {
    throw new Error('Invalid environment:\n  APP_ORIGIN: required in production')
  }
  return env
}

export const isProd = (env: Env) => env.NODE_ENV === 'production'
