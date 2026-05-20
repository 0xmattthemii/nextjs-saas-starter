'use client'

import { useState } from 'react'
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
  name: z.string().min(1, 'Name is required').max(80),
  slug: z
    .string()
    .min(2, 'At least 2 characters')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
})
type FormValues = z.infer<typeof schema>

export function CreateOrgForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const { data, error } = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    })
    if (error) {
      toast.error(error.message ?? 'Could not create workspace')
      return
    }
    if (data?.id) {
      await authClient.organization.setActive({ organizationId: data.id })
    }
    toast.success('Workspace created')
    reset()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Create new workspace
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-org-name">Name</Label>
        <Input id="new-org-name" placeholder="Acme team" {...register('name')} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-org-slug">Slug</Label>
        <Input id="new-org-slug" placeholder="acme-team" {...register('slug')} />
        {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create workspace'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
