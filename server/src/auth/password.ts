import argon2 from 'argon2'

/** OWASP minimum recommendation for argon2id. */
const OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 256

export function hashPassword(password: string) {
  return argon2.hash(password, OPTIONS)
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export function needsRehash(hash: string) {
  return argon2.needsRehash(hash, OPTIONS)
}

let dummyHash: Promise<string> | undefined

/**
 * Spend the same time as a real check when the username doesn't exist,
 * so response timing doesn't reveal whether a username is valid.
 */
export async function burnVerify(password: string) {
  dummyHash ??= hashPassword('torch-timing-equaliser')
  await verifyPassword(await dummyHash, password)
  return false
}
