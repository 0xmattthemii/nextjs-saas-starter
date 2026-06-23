'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { fieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: '/reset-password',
      })
      if (error) {
        toast.error(error.message ?? 'Could not send the reset link.')
        return
      }
      // Always show success to avoid leaking whether an account exists.
      toast.success('If an account exists for that email, a reset link is on its way.')
      setDone(true)
    })
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account exists for that email, a reset link is on its way.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
        {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
      </div>
      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  )
}
