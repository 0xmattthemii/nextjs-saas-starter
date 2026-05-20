import Link from 'next/link'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata = { title: 'Sign in' }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
      </header>
      <SignInForm next={next} initialError={error} hasGoogle={hasGoogle} />
      <p className="text-sm text-muted-foreground text-center">
        No account?{' '}
        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
