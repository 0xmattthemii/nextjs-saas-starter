import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">
          This link is missing the reset token. Request a fresh one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          Send a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose something at least 8 characters long.</p>
      </header>
      <ResetPasswordForm token={token} />
    </div>
  )
}
