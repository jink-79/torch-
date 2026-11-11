import { model, Schema, type InferSchemaType } from 'mongoose'

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/

const userSchema = new Schema(
  {
    /**
     * Torch has exactly one user. A unique index on this constant makes a second user impossible
     * at the database level, whatever code path tries to insert one.
     */
    singleton: { type: String, default: 'owner', immutable: true, unique: true },
    username: { type: String, required: true, lowercase: true, trim: true, match: USERNAME_PATTERN },
    /** argon2id. Never selected unless asked for explicitly. */
    passwordHash: { type: String, required: true, select: false },
    /** Bumped on password change; sessions carrying an older version are rejected (signs out every device). */
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export type UserFields = InferSchemaType<typeof userSchema>
export const User = model('User', userSchema)
