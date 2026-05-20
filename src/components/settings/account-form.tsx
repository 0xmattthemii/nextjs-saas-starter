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
})
type FormValues = z.infer<typeof schema>

export function AccountForm({
  defaultValues,
}: {
  defaultValues: { name: string; email: string }
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValues.name },
  })

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.updateUser({ name: values.name })
    if (error) {
      toast.error(error.message ?? 'Could not update your profile')
      return
    }
    toast.success('Profile updated')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" {...register('name')} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={defaultValues.email} disabled />
        <p className="text-xs text-muted-foreground">
          Email changes are not supported in this starter — wire up Better Auth&apos;s changeEmail flow when you need it.
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
