import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { organization } from 'better-auth/plugins'
import { db } from '@/db'
import * as authSchema from '@/db/schema/auth'
import { sendEmail } from '@/lib/email'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('Missing BETTER_AUTH_SECRET. Generate one with: openssl rand -base64 32')
}

/**
 * Base URL for Better Auth.
 *   - In dev: leave undefined so Better Auth infers it from request headers
 *     (any localhost port works without edits).
 *   - In prod: set BETTER_AUTH_URL to your public origin. VERCEL_URL works as
 *     a fallback on Vercel previews.
 */
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

// Absolute origin for links inside emails (org invites). Dev falls back to localhost.
const appUrl = baseURL ?? 'http://localhost:3000'

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const auth = betterAuth({
  appName: 'SaaS Starter',
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Reset your password: ${url}`,
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      })
    },
  },

  socialProviders: hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,

  session: {
    expiresIn: 60 * 60 * 24 * 30,   // 30 days
    updateAge: 60 * 60 * 24,         // refresh once a day
    // cookieCache is intentionally OFF: the session row carries
    // `activeOrganizationId`, which we mutate from Server Components (e.g. the
    // dashboard auto-setup flow). With cookieCache on, those mutations don't
    // propagate to the request cookie until the next sign-in — leading to a
    // redirect loop on first sign-in. Re-enable only if you're willing to
    // explicitly refresh the cookie after every active-org change.
  },

  plugins: [
    organization({
      // The first user to sign up creates their personal org via the
      // post-sign-up server action; admins can also create more.
      allowUserToCreateOrganization: true,
      sendInvitationEmail: async ({ id, email, organization, inviter }) => {
        const acceptUrl = `${appUrl}/accept-invitation/${id}`
        const who = inviter.user.name || inviter.user.email
        await sendEmail({
          to: email,
          subject: `You've been invited to ${organization.name}`,
          text: `${who} invited you to join ${organization.name}. Accept: ${acceptUrl}`,
          html: `<p><strong>${who}</strong> invited you to join <strong>${organization.name}</strong>.</p><p><a href="${acceptUrl}">Accept invitation</a></p>`,
        })
      },
    }),
    // Must be last — wires Better Auth's cookies into Next.js server actions.
    nextCookies(),
  ],
})

export type Auth = typeof auth
