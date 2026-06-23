import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth/auth'

/**
 * Local-dev seed. Creates a known login so you never have to register by hand
 * (or re-register after wiping the database). Idempotent — safe to re-run.
 *
 * Run: `bun run db:seed`. The personal workspace is created automatically on
 * first sign-in by the dashboard layout, so there's nothing else to set up.
 */
const DEV_USER = {
  name: 'Dev User',
  email: 'dev@acme.test',
  password: 'password',
}

async function main() {
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEV_USER.email))
    .limit(1)

  if (existing) {
    console.log(`✓ Dev user already exists — sign in with ${DEV_USER.email} / ${DEV_USER.password}`)
    return
  }

  await auth.api.signUpEmail({ body: DEV_USER })
  console.log(`✓ Created dev user — sign in with ${DEV_USER.email} / ${DEV_USER.password}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
