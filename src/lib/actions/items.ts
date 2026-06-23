'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { items } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { itemInputSchema } from '@/lib/validators/items'

// Actions mutate + revalidate and RETURN — they don't redirect. The client
// toasts the outcome and navigates, so success/error always surface in a toast.

export async function createItem(formData: FormData): Promise<{ id: string }> {
  const { session, orgId } = await requireActiveOrg()
  const parsed = itemInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    status: formData.get('status') || 'active',
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const [created] = await db
    .insert(items)
    .values({
      ...parsed.data,
      organizationId: orgId,
      createdBy: session.user.id,
    })
    .returning({ id: items.id })

  revalidatePath('/items')
  return { id: created.id }
}

export async function updateItem(id: string, formData: FormData): Promise<void> {
  const { orgId } = await requireActiveOrg()
  const parsed = itemInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    status: formData.get('status') || 'active',
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  await db
    .update(items)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.organizationId, orgId)))

  revalidatePath(`/items/${id}`)
  revalidatePath('/items')
}

export async function deleteItem(id: string): Promise<void> {
  const { orgId } = await requireActiveOrg()
  await db.delete(items).where(and(eq(items.id, id), eq(items.organizationId, orgId)))
  revalidatePath('/items')
}
