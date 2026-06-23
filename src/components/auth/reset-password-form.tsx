'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { fieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({ password: z.string().min(8, 'At least 8 characters') })

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
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
      const { error } = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      })
      if (error) {
        toast.error(error.message ?? 'Could not reset your password.')
        return
      }
      toast.success('Password updated. You can sign in now.')
      router.push('/sign-in?reset=ok')
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" />
        {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
      </div>
      <Button type="submit" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  )
}
