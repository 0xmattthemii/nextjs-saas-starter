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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'member']),
})

export function InviteForm() {
  const router = useRouter()
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
      const { error } = await authClient.organization.inviteMember({
        email: parsed.data.email,
        role: parsed.data.role,
      })
      if (error) {
        toast.error(error.message ?? 'Could not send invitation')
        return
      }
      toast.success(`Invitation sent to ${parsed.data.email}`)
      form.reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Invite by email</Label>
          <Input id="invite-email" name="email" type="email" placeholder="teammate@company.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button type="submit" loading={pending}>
          Send invite
        </Button>
      </div>
      {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
      <p className="text-xs text-muted-foreground">
        Invitations are stored in the database. Wire up an email provider in <code>src/lib/auth/auth.ts</code> to actually deliver them.
      </p>
    </form>
  )
}
