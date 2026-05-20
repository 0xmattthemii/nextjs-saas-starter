import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL')
}

/**
 * Shared `pg` Pool. Singleton across hot reloads in dev so we don't exhaust
 * connections. Use the bare pool for Better Auth (it takes a `pg` Pool); use
 * the Drizzle wrapper (`db`) for application queries.
 */
const globalForPool = globalThis as unknown as { __pgPool?: Pool }

export const pool =
  globalForPool.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  })

if (process.env.NODE_ENV !== 'production') globalForPool.__pgPool = pool

export const db = drizzle(pool, { schema, casing: 'snake_case' })

export type Database = typeof db
export { schema }
