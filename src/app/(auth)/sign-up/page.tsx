import Link from 'next/link'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata = { title: 'Create your account' }

export default function SignUpPage() {
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">It only takes a minute.</p>
      </header>
      <SignUpForm hasGoogle={hasGoogle} />
      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
