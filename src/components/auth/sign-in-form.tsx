'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { safeNextPath } from '@/lib/auth/redirects'
import { fieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from './google-button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const initialErrorMessages: Record<string, string> = {
  org_create_failed: 'We could not set up your workspace. Please sign in again.',
}

export function SignInForm({
  next,
  initialError,
  hasGoogle,
}: {
  next?: string
  initialError?: string
  hasGoogle: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialError) {
      toast.error(initialErrorMessages[initialError] ?? 'Something went wrong. Please try again.')
    }
  }, [initialError])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: next || '/',
      })
      if (error) {
        toast.error(error.message ?? 'Could not sign in. Check your credentials.')
        return
      }
      toast.success('Welcome back')
      router.push(safeNextPath(next))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {hasGoogle ? (
        <>
          <GoogleButton next={next} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" />
          {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
        </div>
        <Button type="submit" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>
    </div>
  )
}
