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
  name: z.string().min(1, 'Name is required').max(80),
  slug: z
    .string()
    .min(2, 'At least 2 characters')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
})
type FormValues = z.infer<typeof schema>

export function OrgGeneralForm({
  org,
  canManage,
}: {
  org: { id: string; name: string; slug: string }
  canManage: boolean
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: org.name, slug: org.slug },
  })

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.organization.update({
      organizationId: org.id,
      data: { name: values.name, slug: values.slug },
    })
    if (error) {
      toast.error(error.message ?? 'Could not update workspace')
      return
    }
    toast.success('Workspace updated')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" disabled={!canManage} {...register('name')} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-slug">Slug</Label>
        <Input id="org-slug" disabled={!canManage} {...register('slug')} />
        {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
      </div>
      {canManage ? (
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only owners and admins can edit workspace details.
        </p>
      )}
    </form>
  )
}
