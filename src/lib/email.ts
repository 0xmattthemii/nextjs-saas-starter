import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'SaaS Starter <onboarding@resend.dev>'

const resend = apiKey ? new Resend(apiKey) : null

/**
 * Send a transactional email via Resend.
 *
 * If `RESEND_API_KEY` is unset (e.g. local dev), it logs the message to the
 * server console instead of throwing — so flows like password reset and org
 * invitations still work end-to-end without configuring a provider.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (!resend) {
    console.info(
      `[email] RESEND_API_KEY not set — not sending.\n  to: ${opts.to}\n  subject: ${opts.subject}\n  ${opts.text}`,
    )
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<p>${opts.text}</p>`,
  })

  if (error) {
    throw new Error(error.message ?? 'Failed to send email')
  }
}
