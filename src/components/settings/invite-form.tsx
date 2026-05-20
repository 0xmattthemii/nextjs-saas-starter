'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'member']),
})
type FormValues = z.infer<typeof schema>

export function InviteForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'member' },
  })

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.organization.inviteMember({
      email: values.email,
      role: values.role,
    })
    if (error) {
      toast.error(error.message ?? 'Could not send invitation')
      return
    }
    toast.success(`Invitation sent to ${values.email}`)
    reset()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Invite by email</Label>
          <Input id="invite-email" type="email" placeholder="teammate@company.com" {...register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            {...register('role')}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
      {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      <p className="text-xs text-muted-foreground">
        Invitations are stored in the database. Wire up an email provider in <code>src/lib/auth/auth.ts</code> to actually deliver them.
      </p>
    </form>
  )
}
