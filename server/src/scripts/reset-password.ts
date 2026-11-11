/**
 * Reset the owner's password:  npm run reset-password -w server
 *
 * Needs shell access to the server and its MONGODB_URI, which is the real trust boundary.
 * Bumps tokenVersion, so every existing session (all devices) is signed out.
 */
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth/password.js'
import { loadEnv } from '../config/env.js'
import { connectDb, disconnectDb } from '../db/connect.js'
import { User } from '../models/User.js'
import { createPrompt } from './prompt.js'

const env = loadEnv()
await connectDb(env.MONGODB_URI)
const prompt = createPrompt()

try {
  const user = await User.findOne()
  if (!user) throw new Error('No user yet. Run: npm run setup-user')

  const password = await prompt.askHidden(`New password for "${user.username}" (min ${PASSWORD_MIN_LENGTH} chars): `)
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`)
  }
  if ((await prompt.askHidden('Repeat password: ')) !== password) throw new Error('Passwords do not match.')

  user.passwordHash = await hashPassword(password)
  user.tokenVersion += 1
  await user.save()
  console.log('Password changed. All devices have been signed out.')
} catch (err) {
  console.error((err as Error).message)
  process.exitCode = 1
} finally {
  prompt.close()
  await disconnectDb()
}
