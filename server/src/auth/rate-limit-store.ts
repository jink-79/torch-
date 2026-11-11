import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit'
import mongoose from 'mongoose'

interface Counter {
  _id: string
  hits: number
  resetAt: Date
}

/**
 * express-rate-limit store backed by MongoDB, so limits hold across serverless instances (Vercel runs
 * many short-lived copies; in-memory counters would reset with each one). One document per key;
 * a TTL index removes expired windows.
 */
export class MongoRateLimitStore implements Store {
  prefix: string
  localKeys = false
  private windowMs = 60_000
  private indexReady: Promise<unknown> | undefined

  constructor(prefix: string) {
    this.prefix = `${prefix}:`
  }

  init(options: Options) {
    this.windowMs = options.windowMs
  }

  private get collection() {
    return mongoose.connection.collection<Counter>('ratelimits')
  }

  private ensureIndex() {
    this.indexReady ??= this.collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 })
    return this.indexReady
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const doc = await this.collection.findOne({ _id: this.prefix + key })
    if (!doc || doc.resetAt <= new Date()) return undefined
    return { totalHits: doc.hits, resetTime: doc.resetAt }
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    await this.ensureIndex()
    const now = new Date()
    const fresh = new Date(now.getTime() + this.windowMs)
    // One atomic update: start a new window if there is none or it has expired, otherwise add a hit.
    const doc = await this.collection.findOneAndUpdate(
      { _id: this.prefix + key },
      [
        { $set: { _expired: { $or: [{ $eq: [{ $type: '$resetAt' }, 'missing'] }, { $lte: ['$resetAt', now] }] } } },
        {
          $set: {
            hits: { $cond: ['$_expired', 1, { $add: ['$hits', 1] }] },
            resetAt: { $cond: ['$_expired', fresh, '$resetAt'] },
          },
        },
        { $unset: '_expired' },
      ],
      { upsert: true, returnDocument: 'after' },
    )
    return { totalHits: doc?.hits ?? 1, resetTime: doc?.resetAt ?? fresh }
  }

  async decrement(key: string) {
    await this.collection.updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } })
  }

  async resetKey(key: string) {
    await this.collection.deleteOne({ _id: this.prefix + key })
  }
}
