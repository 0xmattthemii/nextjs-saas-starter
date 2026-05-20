import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'

/**
 * Get the current user's session. Server Components only.
 *
 * Cached per-request with `React.cache` so multiple callers in the same render
 * share one Better Auth lookup.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

/**
 * Same as `getSession` but redirects to /sign-in when there is no user.
 * Returns a typed non-null user so callers don't need to narrow.
 */
export async function requireSession() {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')
  return session
}

/**
 * Returns the user's active organization id from their session, or null.
 * Most app pages should require an org — use `requireActiveOrg` for that.
 */
export async function getActiveOrgId() {
  const session = await getSession()
  return session?.session.activeOrganizationId ?? null
}

export async function requireActiveOrg() {
  const session = await requireSession()
  const orgId = session.session.activeOrganizationId
  if (!orgId) redirect('/settings/organization?reason=no_active_org')
  return { session, orgId }
}
