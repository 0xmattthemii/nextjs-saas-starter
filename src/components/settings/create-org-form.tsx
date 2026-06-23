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

export function CreateOrgForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
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
      const { data, error } = await authClient.organization.create({
        name: parsed.data.name,
        slug: parsed.data.slug,
      })
      if (error) {
        toast.error(error.message ?? 'Could not create workspace')
        return
      }
      if (data?.id) {
        await authClient.organization.setActive({ organizationId: data.id })
      }
      toast.success('Workspace created')
      setOpen(false)
      router.push('/')
      router.refresh()
    })
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Create new workspace
      </Button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="new-org-name">Name</Label>
        <Input id="new-org-name" name="name" placeholder="Acme team" />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-org-slug">Slug</Label>
        <Input id="new-org-slug" name="slug" placeholder="acme-team" />
        {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          Create workspace
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
