/**
 * One-time owner setup:  npm run setup-user
 *
 * Creates the single Torch user. Refuses to run once a user exists; there is no register route,
 * so after this nobody can create an account. To change a forgotten password use reset-password.
 */
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth/password.js'
import { loadEnv } from '../config/env.js'
import { connectDb, disconnectDb } from '../db/connect.js'
import { User, USERNAME_PATTERN } from '../models/User.js'
import { createPrompt } from './prompt.js'

const env = loadEnv()
await connectDb(env.MONGODB_URI)
const prompt = createPrompt()

try {
  if ((await User.countDocuments()) > 0) {
    console.error('A user already exists. Registration is closed.')
    process.exitCode = 1
  } else {
    const username = (await prompt.ask('Username (3–40 chars: a-z 0-9 . _ -): ')).trim().toLowerCase()
    if (!USERNAME_PATTERN.test(username)) throw new Error('Invalid username.')

    const password = await prompt.askHidden(`Password (min ${PASSWORD_MIN_LENGTH} chars): `)
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`)
    }
    if (password.toLowerCase().includes(username)) throw new Error('Password must not contain the username.')
    if ((await prompt.askHidden('Repeat password: ')) !== password) throw new Error('Passwords do not match.')

    await User.create({ username, passwordHash: await hashPassword(password) })
    console.log(`Created user "${username}". Registration is now closed.`)
  }
} catch (err) {
  // A concurrent setup loses on the unique singleton index.
  const duplicate = (err as { code?: number }).code === 11000
  console.error(duplicate ? 'A user already exists. Registration is closed.' : (err as Error).message)
  process.exitCode = 1
} finally {
  prompt.close()
  await disconnectDb()
}
