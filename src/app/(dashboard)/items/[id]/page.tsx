import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { items } from '@/db/schema'
import { requireActiveOrg } from '@/lib/auth/session'
import { ItemForm } from '@/components/items/item-form'
import { ItemRowActions } from '@/components/items/item-row-actions'
import { updateItem, deleteItem } from '@/lib/actions/items'
import { Skeleton } from '@/components/ui/skeleton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { orgId } = await requireActiveOrg()
  const [item] = await db
    .select({ name: items.name })
    .from(items)
    .where(and(eq(items.id, id), eq(items.organizationId, orgId)))
    .limit(1)
  return { title: item?.name ?? 'Item' }
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetail id={id} />
      </Suspense>
    </div>
  )
}

async function ItemDetail({ id }: { id: string }) {
  const { orgId } = await requireActiveOrg()
  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.organizationId, orgId)))
    .limit(1)

  if (!item) notFound()

  // Bind server actions to this row so the form can submit them directly.
  const update = updateItem.bind(null, item.id)
  const remove = deleteItem.bind(null, item.id)

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <ItemRowActions deleteAction={remove} />
      </header>

      <ItemForm
        action={update}
        defaultValues={{
          name: item.name,
          description: item.description,
          status: item.status as 'active' | 'archived',
        }}
        submitLabel="Save changes"
      />
    </>
  )
}

// Mirrors the header + the three form fields and the save button.
function ItemDetailSkeleton() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    </>
  )
}
