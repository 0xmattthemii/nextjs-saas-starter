import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

/**
 * Next.js 16 renamed middleware to `proxy`. Same shape, runs at the edge by
 * default. This file only checks for a session cookie — full validation
 * happens in the (dashboard) layout via Better Auth's `getSession`.
 *
 * Cookie presence is enough at the proxy layer: validating the session here
 * would mean a DB round-trip on every navigation. The layout already redirects
 * if the session turns out to be invalid.
 */

const PUBLIC_PATHS = new Set([
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  const hasSession = Boolean(getSessionCookie(request))
  const isPublic = PUBLIC_PATHS.has(pathname)

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    if (pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Keep reset-password reachable when signed in — users may arrive from email.
  if (hasSession && (pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/forgot-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
