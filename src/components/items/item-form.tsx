'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Status = 'active' | 'archived'

export function ItemForm({
  action,
  defaultValues,
  submitLabel,
  successMessage = 'Saved',
}: {
  action: (formData: FormData) => Promise<{ id?: string } | void>
  defaultValues?: { name: string; description: string | null; status: Status }
  submitLabel: string
  successMessage?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await action(formData)
        toast.success(successMessage)
        // create() returns the new id → go to it; update() returns void → refresh.
        if (result?.id) router.push(`/items/${result.id}`)
        else router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={defaultValues?.name}
          placeholder="Quarterly review prep"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Optional notes…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? 'active'}
          className="h-9 w-40 rounded-md border bg-background px-3 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/items">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
