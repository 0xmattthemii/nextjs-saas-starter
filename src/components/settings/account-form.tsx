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

const schema = z.object({ name: z.string().min(1, 'Name is required').max(80) })

export function AccountForm({
  defaultValues,
}: {
  defaultValues: { name: string; email: string }
}) {
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
      const { error } = await authClient.updateUser({ name: parsed.data.name })
      if (error) {
        toast.error(error.message ?? 'Could not update your profile')
        return
      }
      toast.success('Profile updated')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" defaultValue={defaultValues.name} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={defaultValues.email} disabled />
        <p className="text-xs text-muted-foreground">
          Email changes are not supported in this starter — wire up Better Auth&apos;s changeEmail flow when you need it.
        </p>
      </div>
      <Button type="submit" loading={pending}>
        Save changes
      </Button>
    </form>
  )
}
