import { defineConfig } from 'drizzle-kit'

// Bun auto-loads .env.local, so no dotenv import needed. If you run drizzle-kit
// with plain node, prefix with: `node --env-file=.env.local …`


if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL — copy .env.example to .env.local and fill it in.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  // Timestamped migration filenames (e.g. 20240115120000_name.sql) so parallel
  // branches don't both grab a sequential number. Order is still tracked in
  // drizzle/meta/_journal.json.
  migrations: { prefix: 'timestamp' },
  dbCredentials: { url: process.env.DATABASE_URL },
  casing: 'snake_case',
  strict: true,
  verbose: true,
})
