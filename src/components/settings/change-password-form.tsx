'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { fieldErrors } from '@/lib/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(8, 'At least 8 characters'),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)))
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      })
      if (error) {
        toast.error(error.message ?? 'Could not change password')
        return
      }
      toast.success('Password updated. Other sessions have been signed out.')
      form.reset()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
        {errors.currentPassword ? (
          <p className="text-xs text-destructive">{errors.currentPassword}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
        {errors.newPassword ? (
          <p className="text-xs text-destructive">{errors.newPassword}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
        {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm}</p> : null}
      </div>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </form>
  )
}
