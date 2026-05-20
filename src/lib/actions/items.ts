'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { items } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { itemInputSchema } from '@/lib/validators/items'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createItem(formData: FormData): Promise<void> {
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
  redirect(`/items/${created.id}`)
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
  redirect('/items')
}
