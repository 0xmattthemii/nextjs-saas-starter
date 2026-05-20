import type { Route } from 'next'

/**
 * Validate a redirect target taken from user input (e.g. a `?next=` param).
 * Rejects external origins and protocol-relative URLs to prevent open
 * redirects, then narrows to `Route` for typed-routes compatibility.
 */
export function safeNextPath(raw: string | null | undefined): Route {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/' as Route
  return raw as Route
}
