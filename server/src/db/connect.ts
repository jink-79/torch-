import mongoose from 'mongoose'

export async function connectDb(uri: string, { maxPoolSize = 10 }: { maxPoolSize?: number } = {}) {
  mongoose.set('strictQuery', true)
  // Fail fast instead of queueing queries forever when the database is unreachable.
  mongoose.set('bufferCommands', false)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize })
  return mongoose.connection
}

export async function disconnectDb() {
  await mongoose.disconnect()
}
