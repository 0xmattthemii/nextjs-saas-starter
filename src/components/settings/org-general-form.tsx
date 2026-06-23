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
  name: z.string().min(1, 'Name is required').max(80),
  slug: z
    .string()
    .min(2, 'At least 2 characters')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
})

export function OrgGeneralForm({
  org,
  canManage,
}: {
  org: { id: string; name: string; slug: string }
  canManage: boolean
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
      const { error } = await authClient.organization.update({
        organizationId: org.id,
        data: { name: parsed.data.name, slug: parsed.data.slug },
      })
      if (error) {
        toast.error(error.message ?? 'Could not update workspace')
        return
      }
      toast.success('Workspace updated')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" name="name" defaultValue={org.name} disabled={!canManage} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-slug">Slug</Label>
        <Input id="org-slug" name="slug" defaultValue={org.slug} disabled={!canManage} />
        {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
      </div>
      {canManage ? (
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only owners and admins can edit workspace details.
        </p>
      )}
    </form>
  )
}
