import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { connectDb, disconnectDb } from './db/connect.js'

const env = loadEnv()
const connection = await connectDb(env.MONGODB_URI)
console.log(`[db] connected to "${connection.name}"`)

const app = createApp(env)
const server = app.listen(env.PORT, () => {
  console.log(`[http] torch-server listening on :${env.PORT} (${env.NODE_ENV})`)
})

async function shutdown(signal: string) {
  console.log(`[http] ${signal}: shutting down`)
  server.close()
  await disconnectDb()
  process.exit(0)
}
process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))
